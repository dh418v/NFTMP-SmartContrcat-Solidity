// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IContentNFT {
    struct TransferHistory {
        address from;
        address to;
        uint256 timestamp;
    }
    function owner() external view returns (address);
    function ownerOf(uint256 tokenId) external view returns (address);
    function factory() external view returns (address);
    function tokenNumber() external view returns (uint256);
    function mintFee() external view returns (uint256);
    function burnFee() external view returns (uint256);
    function initialize(string memory _name, string memory _symbol,
        address _owner, uint256 _mintFee, uint256 _burnFee, address _USDC, address _marketplace) external;
    function mint(string memory _nftURI) external returns (uint256);
    function burn(uint256 tokenId) external returns (uint256);
    function tokenURI(uint256 _tokenId) external view returns (string memory);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getTransferHistory(uint256 tokenId) external view returns (TransferHistory[] memory);
    function getLoyaltyFee(uint256 tokenId) external view returns (uint256);
    function setLoyaltyFee(uint256 _tokenId, uint256 _loyaltyFee) external;
}