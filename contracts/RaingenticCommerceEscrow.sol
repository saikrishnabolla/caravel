// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract RaingenticCommerceEscrow {
    enum Status { None, Created, Funded, Released, Refunded, Cancelled }

    struct Order {
        address buyer;
        address merchant;
        address token;
        uint256 totalAmount;
        uint256 depositRequired;
        uint256 depositedAmount;
        uint64 expiresAt;
        bytes32 termsHash;
        Status status;
    }

    mapping(bytes32 => Order) public orders;

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed merchant, address token, uint256 totalAmount, uint256 depositRequired, uint64 expiresAt, bytes32 termsHash);
    event OrderFunded(bytes32 indexed orderId, uint256 amount, uint256 depositedAmount);
    event OrderReleased(bytes32 indexed orderId, uint256 amount);
    event OrderRefunded(bytes32 indexed orderId, uint256 amount);
    event OrderCancelled(bytes32 indexed orderId);

    error InvalidOrder();
    error InvalidState();
    error Unauthorized();
    error TransferFailed();

    function createOrder(bytes32 orderId, address merchant, address token, uint256 totalAmount, uint256 depositRequired, uint64 expiresAt, bytes32 termsHash) external {
        if (orderId == bytes32(0) || merchant == address(0) || token == address(0) || totalAmount == 0 || depositRequired > totalAmount || expiresAt <= block.timestamp || orders[orderId].status != Status.None) revert InvalidOrder();
        orders[orderId] = Order(msg.sender, merchant, token, totalAmount, depositRequired, 0, expiresAt, termsHash, Status.Created);
        emit OrderCreated(orderId, msg.sender, merchant, token, totalAmount, depositRequired, expiresAt, termsHash);
    }

    function fundOrder(bytes32 orderId, uint256 amount) external {
        Order storage order = orders[orderId];
        if (order.status != Status.Created && order.status != Status.Funded) revert InvalidState();
        if (msg.sender != order.buyer || amount == 0 || order.depositedAmount + amount > order.totalAmount) revert Unauthorized();
        if (!IERC20(order.token).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        order.depositedAmount += amount;
        if (order.depositedAmount >= order.depositRequired) order.status = Status.Funded;
        emit OrderFunded(orderId, amount, order.depositedAmount);
    }

    function release(bytes32 orderId) external {
        Order storage order = orders[orderId];
        if (msg.sender != order.buyer) revert Unauthorized();
        if (order.status != Status.Funded || order.depositedAmount < order.depositRequired) revert InvalidState();
        uint256 amount = order.depositedAmount;
        order.depositedAmount = 0;
        order.status = Status.Released;
        if (!IERC20(order.token).transfer(order.merchant, amount)) revert TransferFailed();
        emit OrderReleased(orderId, amount);
    }

    function refund(bytes32 orderId) external {
        Order storage order = orders[orderId];
        if (order.status != Status.Funded) revert InvalidState();
        if (msg.sender != order.merchant && !(msg.sender == order.buyer && block.timestamp > order.expiresAt)) revert Unauthorized();
        uint256 amount = order.depositedAmount;
        order.depositedAmount = 0;
        order.status = Status.Refunded;
        if (!IERC20(order.token).transfer(order.buyer, amount)) revert TransferFailed();
        emit OrderRefunded(orderId, amount);
    }

    function cancel(bytes32 orderId) external {
        Order storage order = orders[orderId];
        if (msg.sender != order.buyer) revert Unauthorized();
        if (order.status != Status.Created || order.depositedAmount != 0) revert InvalidState();
        order.status = Status.Cancelled;
        emit OrderCancelled(orderId);
    }
}
