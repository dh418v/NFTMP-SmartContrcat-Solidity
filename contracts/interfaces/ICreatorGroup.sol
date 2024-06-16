// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreatorGroup {
    struct soldInfor {
        uint256 id;
        uint256 price;
        bool distributeState;
    }

    function initialize(
        string memory _name,
        string memory _description,
        address[] memory _members,
        address _collectionAddress,
        address _marketplace,
        uint256 _mintFee,
        uint256 _burnFee,
        address _USDC
    ) external;

    function setTeamScore(uint256 value) external;

    function alarmSoldOut(
        address contractAddress,
        uint256 nftId,
        uint256 price
    ) external;

    function mint(string memory _nftURI) external;

    function listToEnglishAuction(
        uint256 id,
        uint256 initialPrice,
        uint256 salePeriod
    ) external;

    function listToDutchAuction(
        uint256 id,
        uint256 initialPrice,
        uint256 reducingRate,
        uint256 salePeriod
    ) external;

    function listToOfferingSale(uint256 id, uint256 initialPrice) external;

    function endEnglishAuction(uint256 id) external;

    function withdrawFromMarketplace() external;

    function setNewDirector(address _candidate) external;

    function submitOfferingSaleTransaction(
        uint256 _marketId,
        uint256 tokenId,
        address _buyer,
        uint256 _price
    ) external;

    function executeOfferingSaleTransaction(uint256 index) external;

    function getNftOfId(uint256 index) external view returns (uint256);

    function getSoldNumber() external view returns (uint256);

    function getRevenueDistribution(
        address one,
        uint256 id
    ) external view returns (uint256);

    function getSoldInfor(
        uint256 index
    ) external view returns (soldInfor memory);

    function withdraw() external;

    function addMember(address _newMember) external;

    function leaveGroup() external;

    function alarmLoyaltyFeeReceived(uint256 nftId, uint256 price) external;

    function executeBurnTransaction(uint256 index) external;
}
