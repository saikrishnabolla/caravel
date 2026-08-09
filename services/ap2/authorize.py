#!/usr/bin/env python3
"""Create and verify official Google AP2 checkout and payment mandate chains."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any

from ap2.sdk.checkout_mandate_chain import CheckoutMandateChain
from ap2.sdk.generated.checkout_mandate import CheckoutMandate
from ap2.sdk.generated.open_checkout_mandate import (
    AllowedMerchants,
    Item as MandateItem,
    LineItemRequirements,
    LineItems,
    OpenCheckoutMandate,
)
from ap2.sdk.generated.open_payment_mandate import (
    AllowedPayees,
    AllowedPaymentInstruments,
    AmountRange,
    OpenPaymentMandate,
)
from ap2.sdk.generated.payment_mandate import PaymentMandate
from ap2.sdk.generated.types.amount import Amount
from ap2.sdk.generated.types.checkout import Checkout, Status
from ap2.sdk.generated.types.item import Item
from ap2.sdk.generated.types.line_item import LineItem
from ap2.sdk.generated.types.link import Link
from ap2.sdk.generated.types.merchant import Merchant
from ap2.sdk.generated.types.payment_instrument import PaymentInstrument
from ap2.sdk.generated.types.total import Total
from ap2.sdk.mandate import MandateClient
from ap2.sdk.payment_mandate_chain import PaymentMandateChain
from ap2.sdk.utils import compute_sha256_b64url
from jwcrypto import jwt
from jwcrypto.jwk import JWK


ROOT = Path(__file__).resolve().parents[2]
KEY_DIR = ROOT / ".secrets" / "ap2"


def safe_name(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_.-]", "-", value)


def load_or_create_key(name: str) -> JWK:
    KEY_DIR.mkdir(parents=True, exist_ok=True)
    path = KEY_DIR / f"{safe_name(name)}.jwk"
    if path.exists():
        return JWK.from_json(path.read_text())
    key = JWK.generate(kty="EC", crv="P-256")
    data = json.loads(key.export(private_key=True))
    data["kid"] = name
    key = JWK.from_json(json.dumps(data))
    path.write_text(key.export(private_key=True))
    os.chmod(path, 0o600)
    return key


def public_dict(key: JWK) -> dict[str, Any]:
    return json.loads(key.export_public())


def make_cnf(key: JWK) -> dict[str, Any]:
    return {"jwk": public_dict(key)}


def merchant_checkout_jwt(
    merchant_key: JWK,
    merchant: Merchant,
    checkout_id: str,
    sku: str,
    title: str,
    quantity: int,
    amount_cents: int,
    currency: str,
    expires_at: str,
) -> str:
    unit_price = amount_cents // quantity
    checkout = Checkout(
        id=checkout_id,
        merchant=merchant,
        line_items=[
            LineItem(
                id=f"line-{sku}",
                item=Item(id=sku, title=title, price=unit_price),
                quantity=quantity,
                totals=[
                    Total(type="subtotal", amount=amount_cents),
                    Total(type="total", amount=amount_cents),
                ],
            )
        ],
        status=Status.ready_for_complete,
        currency=currency,
        totals=[
            Total(type="subtotal", amount=amount_cents),
            Total(type="total", amount=amount_cents),
        ],
        links=[
            Link(type="terms_of_service", url="https://raingentic.local/terms"),
            Link(type="privacy_policy", url="https://raingentic.local/privacy"),
        ],
        expires_at=expires_at,
    )
    token = jwt.JWT(
        header={"alg": "ES256", "typ": "JWT", "kid": merchant_key.key_id},
        claims=checkout.model_dump_json(exclude_none=True),
    )
    token.make_signed_token(merchant_key)
    return token.serialize()


def verify_merchant_checkout(token: str, merchant_key: JWK) -> None:
    verified = jwt.JWT(jwt=token, key=JWK.from_json(merchant_key.export_public()))
    json.loads(verified.claims)


def create_authorization(data: dict[str, Any]) -> dict[str, Any]:
    authorization_id = data.get("authorizationId") or str(uuid.uuid4())
    buyer_id = data["buyerId"]
    agent_id = data["agentId"]
    merchant_id = data["merchantId"]
    merchant_name = data["merchantName"]
    merchant_website = data.get("merchantWebsite")
    sku = data["sku"]
    title = data["title"]
    quantity = int(data["quantity"])
    amount_cents = int(data["amountCents"])
    maximum_cents = int(data["maximumCents"])
    currency = data.get("currency", "USD")
    instrument_type = data["paymentInstrument"]
    now = int(time.time())
    expires = now + int(data.get("expiresInSeconds", 900))
    expires_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires))

    buyer_key = load_or_create_key(f"buyer-{buyer_id}")
    agent_key = load_or_create_key(f"agent-{agent_id}")
    merchant_key = load_or_create_key(f"merchant-{merchant_id}")
    merchant = Merchant(id=merchant_id, name=merchant_name, website=merchant_website)
    payment_instrument = PaymentInstrument(
        id=f"instrument-{instrument_type}",
        type=instrument_type,
        description=data.get("paymentDescription", instrument_type),
    )
    checkout_id = f"checkout-{authorization_id}"
    checkout_jwt = merchant_checkout_jwt(
        merchant_key,
        merchant,
        checkout_id,
        sku,
        title,
        quantity,
        amount_cents,
        currency,
        expires_iso,
    )
    verify_merchant_checkout(checkout_jwt, merchant_key)
    checkout_hash = compute_sha256_b64url(checkout_jwt)
    client = MandateClient()

    open_checkout = client.create(
        payloads=[
            OpenCheckoutMandate(
                constraints=[
                    AllowedMerchants(allowed=[merchant]),
                    LineItems(
                        items=[
                            LineItemRequirements(
                                id=f"requirement-{sku}",
                                acceptable_items=[MandateItem(id=sku, title=title)],
                                quantity=quantity,
                            )
                        ]
                    ),
                ],
                cnf=make_cnf(agent_key),
                iat=now,
                exp=expires,
            )
        ],
        issuer_key=buyer_key,
    )
    checkout_chain_token = client.present(
        holder_key=agent_key,
        mandate_token=open_checkout,
        payloads=[
            CheckoutMandate(
                checkout_jwt=checkout_jwt,
                checkout_hash=checkout_hash,
                iat=now,
                exp=expires,
            )
        ],
        aud=merchant_id,
        nonce=authorization_id,
    )

    open_payment = client.create(
        payloads=[
            OpenPaymentMandate(
                constraints=[
                    AllowedPayees(allowed=[merchant]),
                    AmountRange(currency=currency, min=0, max=maximum_cents),
                    AllowedPaymentInstruments(allowed=[payment_instrument]),
                ],
                cnf=make_cnf(agent_key),
                iat=now,
                exp=expires,
            )
        ],
        issuer_key=buyer_key,
    )
    payment_chain_token = client.present(
        holder_key=agent_key,
        mandate_token=open_payment,
        payloads=[
            PaymentMandate(
                transaction_id=checkout_hash,
                payee=merchant,
                payment_amount=Amount(amount=amount_cents, currency=currency),
                payment_instrument=payment_instrument,
                risk_data={"authorization_id": authorization_id, "source": "raingentic"},
                iat=now,
                exp=expires,
            )
        ],
        aud=merchant_id,
        nonce=authorization_id,
    )

    bundle = {
        "authorizationId": authorization_id,
        "buyerId": buyer_id,
        "agentId": agent_id,
        "merchantId": merchant_id,
        "merchantName": merchant_name,
        "sku": sku,
        "title": title,
        "quantity": quantity,
        "amountCents": amount_cents,
        "maximumCents": maximum_cents,
        "currency": currency,
        "paymentInstrument": instrument_type,
        "nonce": authorization_id,
        "audience": merchant_id,
        "checkoutJwt": checkout_jwt,
        "checkoutHash": checkout_hash,
        "checkoutMandateToken": checkout_chain_token,
        "paymentMandateToken": payment_chain_token,
        "buyerPublicKey": public_dict(buyer_key),
        "merchantPublicKey": public_dict(merchant_key),
        "expiresAt": expires,
    }
    verification = verify_authorization(bundle)
    bundle["verification"] = verification
    return bundle


def verify_authorization(bundle: dict[str, Any]) -> dict[str, Any]:
    client = MandateClient()
    buyer_public = JWK.from_json(json.dumps(bundle["buyerPublicKey"]))
    merchant_public = JWK.from_json(json.dumps(bundle["merchantPublicKey"]))
    verify_merchant_checkout(bundle["checkoutJwt"], merchant_public)

    checkout_payloads = client.verify(
        token=bundle["checkoutMandateToken"],
        key_or_provider=lambda _token: buyer_public,
        expected_aud=bundle["audience"],
        expected_nonce=bundle["nonce"],
    )
    checkout_chain = CheckoutMandateChain.parse(checkout_payloads)
    checkout_violations = checkout_chain.verify(
        expected_checkout_hash=bundle["checkoutHash"],
        checkout_jwt=bundle["checkoutJwt"],
    )

    payment_payloads = client.verify(
        token=bundle["paymentMandateToken"],
        key_or_provider=lambda _token: buyer_public,
        expected_aud=bundle["audience"],
        expected_nonce=bundle["nonce"],
    )
    payment_chain = PaymentMandateChain.parse(payment_payloads)
    payment_violations = payment_chain.verify(
        expected_transaction_id=bundle["checkoutHash"],
    )
    violations = checkout_violations + payment_violations
    if violations:
        raise ValueError("; ".join(violations))

    return {
        "valid": True,
        "checkoutVct": checkout_chain.closed_mandate.vct,
        "paymentVct": payment_chain.closed_mandate.vct,
        "openCheckoutVct": checkout_chain.open_mandate.vct,
        "openPaymentVct": payment_chain.open_mandate.vct,
        "checkoutReference": compute_sha256_b64url(
            client.get_closed_mandate_jwt(bundle["checkoutMandateToken"])
        ),
        "paymentReference": compute_sha256_b64url(
            client.get_closed_mandate_jwt(bundle["paymentMandateToken"])
        ),
        "merchantSignatureVerified": True,
        "constraintsVerified": True,
    }


def main() -> None:
    request = json.load(sys.stdin)
    action = request.get("action", "create")
    if action == "create":
        result = create_authorization(request["data"])
    elif action == "verify":
        result = verify_authorization(request["bundle"])
    else:
        raise ValueError(f"Unsupported action: {action}")
    json.dump(result, sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        json.dump({"error": str(error)}, sys.stdout, separators=(",", ":"))
        sys.exit(1)
