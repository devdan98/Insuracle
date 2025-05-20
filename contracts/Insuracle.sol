// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Insuracle is AccessControl {
    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");
    bytes32 public constant INSURANCE_ADMIN_ROLE = keccak256("INSURANCE_ADMIN_ROLE");

    AggregatorV3Interface public priceFeed;
    uint256 public insuranceAmount;
    bool public isInitialized;

    struct Policy {
        address customer;
        uint256 premium; // Paid in wei
        uint256 coverage; // Payout amount in wei
        bool active;
        bool paidOut;
    }

    mapping(address => Policy) public policies;
    int256 public constant FLOOD_THRESHOLD = 3000e8;

    event InsurancePurchased(address indexed customer, uint256 premium, uint256 coverage);
    event PayoutTriggered(address indexed customer, uint256 amount);

    constructor(address _priceFeedAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_UPDATER_ROLE, msg.sender);
        _grantRole(INSURANCE_ADMIN_ROLE, msg.sender);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isInitialized = true;
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function setInsuranceAmount(uint256 _amount) public onlyRole(INSURANCE_ADMIN_ROLE) {
        insuranceAmount = _amount;
    }

    function setOracleAddress(address _oracleAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        priceFeed = AggregatorV3Interface(_oracleAddress);
    }

    function buyInsurance(uint256 _coverage) external payable {
        require(msg.value > 0, "Premium must be greater than 0");
        require(_coverage > 0, "Coverage must be greater than 0");
        require(!policies[msg.sender].active, "Policy already active");

        uint256 requiredPremium = _coverage / 10;
        require(msg.value >= requiredPremium, "Insufficient premium");

        policies[msg.sender] = Policy({
            customer: msg.sender,
            premium: msg.value,
            coverage: _coverage,
            active: true,
            paidOut: false
        });

        emit InsurancePurchased(msg.sender, msg.value, _coverage);
    }

    function triggerPayout() external {
        Policy storage policy = policies[msg.sender];
        require(policy.active, "No active policy");
        require(!policy.paidOut, "Payout already issued");

        int256 floodLevel = getLatestPrice();
        require(floodLevel >= FLOOD_THRESHOLD, "Flood level below threshold");

        policy.paidOut = true;
        policy.active = false;

        (bool sent, ) = msg.sender.call{value: policy.coverage}("");
        require(sent, "Payout failed");

        emit PayoutTriggered(msg.sender, policy.coverage);
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Withdrawal failed");
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
