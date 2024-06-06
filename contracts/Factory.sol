// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ICreatorGroup.sol";
import "./interfaces/IContentNFT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Factory {
    // State variables
    address public owner; // Address of the contract owner
    address public developmentTeam; // Address of the development team associated with the contract
    address public marketplace; // Address of the marketplace contract
    uint256 public numberOfCreators; // Number of creators associated with the contract
    address[] public Creators; // Array to store addresses of creators
    mapping(address => bool) isCreatorGroupAddress; // Mapping to check if the address is a creator group
    address public implementGroup; // Address of the implementation contract for creating groups
    address public implementContent; // Address of the implementation contract for creating content
    uint256 public mintFee; // Fee required for minting NFTs
    uint256 public burnFee; // Fee required for burning NFTs
    address public USDC; // Address of the USDC token contract
    IERC20 public immutable USDC_token; // USDC token contract

    // Events
    event GroupCreated(
        address indexed creator,
        string indexed name,
        string indexed description,
        address newDeployedAddress
    );
    event NewNFTMinted(address indexed creator, address indexed nftAddress);
    event WithdrawalFromDevelopmentTeam(address indexed withdrawer, uint256 indexed amount);
    event TeamScoreChanged(address indexed teamMember, uint256 indexed score);
        // Modifier to restrict access to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    modifier onlyGroup() {
        require(isCreatorGroupAddress[msg.sender] == true, "Only group can call this function");
        _;
    }
    /// @notice Constructor to initialize contract variables
    /// @param _implementGroup Address of the implementation contract for creating groups
    /// @param _implementContent Context of the implementation contract for NFT Collection
    /// @param _marketplace Address of the marketplace contract
    /// @param _developmentTeam Address of the development team
    /// @param _mintFee Fee required for minting NFTs
    /// @param _burnFee Fee required for burning NFTs
    /// @param _USDC Address of the USDC token contract
    constructor(
        address _implementGroup,
        address _implementContent,
        address _marketplace,
        address _developmentTeam,
        uint256 _mintFee,
        uint256 _burnFee,
        address _USDC
    )  {
        owner = msg.sender;
        require(_marketplace!= address(0), "Address cannot be 0");
        marketplace = _marketplace;
        require(_developmentTeam!= address(0), "Address cannot be 0");
        developmentTeam = _developmentTeam;
        numberOfCreators = 0;
        mintFee = _mintFee;
        burnFee = _burnFee;
        require(_implementGroup != address(0), "Address cannot be 0");
        implementGroup = _implementGroup;
        require(_implementContent!= address(0), "Address cannot be 0");
        implementContent = _implementContent;
        require(_USDC != address(0), "Address cannot be 0");
        USDC = _USDC;
        USDC_token = IERC20(_USDC);
    }

    /// @notice Function to create a new group
    /// @param _name The name of the group
    /// @param _description The description of the group
    /// @param _members The members of the group
    function createGroup(
        string memory _name,
        string memory _description,
        address[] memory _members
    ) external {
        require(_members.length != 0, "At least one owner is required");
        address newDeployedAddress = Clones.clone(implementGroup);
        address newCollectionAddress = Clones.clone(implementContent);
        IContentNFT(newCollectionAddress).initialize(
            _name,
            _name,
            newDeployedAddress,
            mintFee,
            burnFee,
            USDC,
            marketplace
        );
        ICreatorGroup(newDeployedAddress).initialize(
            _name,
            _description,
            _members,
            newCollectionAddress,
            marketplace,
            mintFee,
            burnFee,
            USDC
        );
        Creators.push(newDeployedAddress);
        isCreatorGroupAddress[newDeployedAddress] = true;
        numberOfCreators = Creators.length;
        emit GroupCreated(msg.sender, _name, _description, newDeployedAddress);        
    }

    /// @notice Function for the development team to withdraw funds
    /// @dev Only the development team can call this function
    function withdraw() external {
        require(msg.sender == developmentTeam, "Invalid withdrawer");
        uint256 amount = IERC20(USDC).balanceOf(address(this));
        if(amount != 0) {
            SafeERC20.safeTransfer(USDC_token, msg.sender, amount) ;
        }
        emit WithdrawalFromDevelopmentTeam(msg.sender, amount);
    }

    /// @notice Function for the owner to set the team score for revenue distribution of a creator group
    /// @param _id The ID of the creator group
    /// @param _score The team score for the creator group
    function setTeamScoreForCreatorGroup(
        uint256 _id,
        uint256 _score
    ) external onlyOwner {
        require(Creators.length > _id, "Invalid creator group");
        require(_score >= 0 && _score <= 100, "Invalid score");
        ICreatorGroup(Creators[_id]).setTeamScore(_score);
        emit TeamScoreChanged(Creators[_id], _score);
    }

    /// @notice Function to check if it is a creator group
    /// @param _groupAddress The group address
    /// @return The bool value if it is a creator group -> true, or not -> false
    function isCreatorGroup(address _groupAddress) external view returns(bool){
        return isCreatorGroupAddress[_groupAddress];
    }

    /// @notice Function to get the address of a creator group at a specific index
    /// @param _id The ID of the creator group
    /// @return The address of the creator group
    function getCreatorGroupAddress(uint256 _id) external view returns (address) {
        return Creators[_id];
    }
}
