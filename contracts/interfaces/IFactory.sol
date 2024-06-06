// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFactory {
    function createGroup(
        string memory name,
        string memory description,
        address[] memory owners
    ) external;
    function withdraw() external;
    function setTeamScoreForCreatorGroup(uint256 id, uint256 score) external;
    function isCreatorGroup(address _groupAddress) external view returns(bool);
    function getCreatorGroupAddress(uint256 id) external view returns(address);
}