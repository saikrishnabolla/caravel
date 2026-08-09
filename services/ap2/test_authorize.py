from __future__ import annotations

import copy

import pytest

from authorize import create_authorization, verify_authorization


def authorization_data(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "authorizationId": "ap2-test-authorization",
        "buyerId": "test-buyer",
        "agentId": "test-agent",
        "merchantId": "test-merchant",
        "merchantName": "Test Merchant",
        "sku": "test-service",
        "title": "Test service",
        "quantity": 1,
        "amountCents": 100,
        "maximumCents": 100,
        "currency": "USD",
        "paymentInstrument": "rain-card",
        "paymentDescription": "Test Rain card",
    }
    data.update(overrides)
    return data


def test_valid_checkout_and_payment_mandates_verify() -> None:
    bundle = create_authorization(authorization_data())

    verification = verify_authorization(bundle)

    assert verification["valid"] is True
    assert verification["checkoutVct"] == "mandate.checkout.1"
    assert verification["paymentVct"] == "mandate.payment.1"
    assert verification["merchantSignatureVerified"] is True
    assert verification["constraintsVerified"] is True


def test_amount_above_buyers_maximum_is_rejected() -> None:
    with pytest.raises(ValueError, match="exceeds maximum"):
        create_authorization(authorization_data(amountCents=101, maximumCents=100))


def test_wrong_audience_is_rejected() -> None:
    bundle = create_authorization(authorization_data())
    wrong_audience = copy.deepcopy(bundle)
    wrong_audience["audience"] = "different-merchant"

    with pytest.raises(Exception):
        verify_authorization(wrong_audience)


def test_tampered_payment_mandate_is_rejected() -> None:
    bundle = create_authorization(authorization_data())
    tampered = copy.deepcopy(bundle)
    token = tampered["paymentMandateToken"]
    tampered["paymentMandateToken"] = f"{token[:-1]}{'A' if token[-1] != 'A' else 'B'}"

    with pytest.raises(Exception):
        verify_authorization(tampered)
