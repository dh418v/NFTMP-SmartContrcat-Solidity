// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/ICreatorGroup.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IMarketplace.sol";
import "./interfaces/IContentNFT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";



contract CreatorGroup is Initializable, ICreatorGroup, ReentrancyGuard {
    // Struct for offering transactions
    struct transaction_offering {
        uint256 marketId;
        uint256 id;
        uint256 price;
        address buyer;
        bool endState;
    }
    // Struct for recording member information in revenue
    struct record_member {
        address _member;
        uint256 _percent;
        uint256 _sum;
    }
    // State variables
    address public USDC; // USDC token address
    IERC20 public USDC_token; // USDC token contract
    string public name; // Name of the CreatorGroup
    string public description; // Description of the CreatorGroup
    address public collectionAddress; // Collection address
    uint256 public mintFee; // Fee for minting NFTs
    uint256 public burnFee; // Fee for burning NFTs
    uint256 public numberOfMembers; // Number of members in the group
    address[] public members; // Array to store member addresses
    address public factory; // Address of the factory contract
    address public marketplace; // Address of the marketplace contract
    mapping(address => uint256) public balance; // Mapping to store balances of members
    mapping(address => bool) public isOwner; // Mapping to track ownership status of members' addresses
    address public director; // Address of the director for certain functions
    soldInfor[] public soldInformation; // Array to store sold NFT information
    uint256 public currentDistributeNumber; // Current distribution number
    uint256 public teamScore; // Team score
    uint256 public totalEarning; //Total Earning
    uint256 public numberOfNFT; // Number of NFTs in the group
    mapping(uint256 => uint256) public nftIdArr; // Mapping of NFT IDs
    mapping(uint256 => bool) public listedState; // Mapping to track the listing state of NFTs
    mapping(uint256 => bool) public soldOutState; // Mapping to track the sold state of NFTs
    mapping(address => mapping(uint256 => uint256)) public revenueDistribution; // Mapping for revenue distribution of NFTs
    mapping(address => mapping(uint256 => uint256)) public getNFTId; // Mapping for getting NFT IDs
    transaction_offering[] public transactions_offering; // Array of  offering transaction
    mapping(uint256 => record_member[]) public Recording; // Recording for sold NFT's distribution
    // events
    event TeamScoreSet(uint256 value);
    event NFTMinted(address indexed nftAddress, uint256 indexed nftId);
    event NFTBurned(uint256 indexed nftId);
    event EnglishAuctionListed(
        uint256 indexed nftId,
        uint256 indexed initialPrice,
        uint256 indexed salePeriod
    );
    event DutchAuctionListed(
        uint256 indexed nftId,
        uint256 indexed initialPrice,
        uint256 indexed reducingRate,
        uint256 salePeriod
    );
    event OfferingSaleListed(
        uint256 indexed nftId,
        uint256 indexed initialPrice
    );
    event EnglishAuctionEnded(uint256 indexed nftId);
    event WithdrawalFromMarketplace();
    event DirectorSettingExecuted(address indexed _director);
    event OfferingSaleTransactionProposed(
        address indexed _tokenContractAddress,
        uint256 indexed tokenId,
        address indexed _buyer,
        uint256 _price
    );
    event OfferingSaleTransactionExecuted(uint256 indexed index);
    event WithdrawHappened(
        address indexed from,
        uint256 indexed balanceToWithdraw
    );
    event LoyaltyFeeReceived(uint256 indexed id, uint256 indexed price);
    // Modifier to restrict access to only director
    modifier onlyDirector() {
        require(
            msg.sender == director,
            "Only delegated member can call this function"
        );
        _;
    }
    // Modifier to restrict access to only members
    modifier onlyMembers() {
        require(
            isOwner[msg.sender] == true,
            "Only members can call this function"
        );
        _;
    }
    // Modifier to restrict access to only marketplace contract
    modifier onlyMarketplace() {
        require(
            msg.sender == marketplace,
            "only Marketplace can Call this function."
        );
        _;
    }
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function.");
        _;
    }

    /// @notice Function to initialize the CreatorGroup contract with member addresses and other parameters
    /// @param _name Name of the group
    /// @param _description Description of the group
    /// @param _members Member addresses
    /// @param _marketplace Marketplace contract address
    /// @param _mintFee Mint fee
    /// @param _burnFee Burn Fee
    /// @param _USDC Address of the USDC token contract
    function initialize(
        string memory _name,
        string memory _description,
        address[] memory _members,
        address _collectionAddress,
        address _marketplace,
        uint256 _mintFee,
        uint256 _burnFee,
        address _USDC
    ) external initializer {
        name = _name;
        description = _description;
        for (uint256 i = 0; i < _members.length; ++i) {
            if (!isOwner[_members[i]]) {
                members.push(_members[i]);
                isOwner[_members[i]] = true;
            }
        }
        numberOfMembers = members.length;
        require(_collectionAddress != address(0), "Invalid Collection Address");
        collectionAddress = _collectionAddress;
        require(_marketplace != address(0), "Invalid Marketplace Address");
        marketplace = _marketplace;
        mintFee = _mintFee;
        burnFee = _burnFee;
        factory = msg.sender;
        director = members[0];
        numberOfNFT = 0;
        currentDistributeNumber = 0;
        teamScore = 80;
        require(_USDC != address(0), "Invalid USDC Address");
        USDC = _USDC;
        USDC_token = IERC20(USDC);
    }

    /// @notice Function to add a new member to the CreatorGroup
    /// @param _newMember Address of the new member to be added
    function addMember(address _newMember) external onlyDirector {
        require(!isOwner[_newMember], "Already existing member!");
        require(_newMember != address(0), "Invalid Address");
        members.push(_newMember);
        isOwner[_newMember] = true;
        numberOfMembers++;
    }

    /// @notice Function to remove a member from the CreatorGroup
    function leaveGroup() external onlyMembers {
        address _oldMember = msg.sender;
        delete isOwner[_oldMember];
        uint256 id = 0;
        for (uint256 i = 0; i < members.length; ++i) {
            if (members[i] == _oldMember) id = i;
        }
        members[id] = members[numberOfMembers - 1];
        delete members[numberOfMembers - 1];
        numberOfMembers--;
    }

    /// @notice Function to mint an existing NFT Collection
    /// @param _nftURI The URI of the NFT
    function mint(
        string memory _nftURI
    ) external onlyDirector {
        address _targetCollection = collectionAddress;
        if (mintFee != 0) {
            SafeERC20.forceApprove(USDC_token, _targetCollection, mintFee);
        }
        nftIdArr[numberOfNFT] = IContentNFT(_targetCollection).mint(_nftURI);
        getNFTId[_targetCollection][nftIdArr[numberOfNFT]] = numberOfNFT;
        for (uint256 i = 0; i < members.length; ++i) {
            record_member memory tmp = record_member(members[i], 0, 0);
            Recording[numberOfNFT].push(tmp);
        }
        emit NFTMinted(_targetCollection, numberOfNFT);
        numberOfNFT++;
    }

    /// @notice Function to list an NFT for an English auction
    /// @param _id The id of the NFT in the group
    /// @param _initialPrice The initial price of the NFT
    /// @param _salePeriod The sale period of the NFT
    function listToEnglishAuction(
        uint256 _id,
        uint256 _initialPrice,
        uint256 _salePeriod
    ) external onlyDirector {
        require(_id <= numberOfNFT - 1 && _id >= 0, "NFT does not exist!");
        require(listedState[_id] == false, "Already listed!");
        listedState[_id] = true;
        IERC721(collectionAddress).approve(marketplace, nftIdArr[_id]);
        IMarketplace(marketplace).listToEnglishAuction(
            collectionAddress,
            nftIdArr[_id],
            _initialPrice,
            _salePeriod
        );
        emit EnglishAuctionListed(_id, _initialPrice, _salePeriod);
    }

    /// @notice Function to list an NFT for a Dutch auction
    /// @param _id The id of the NFT in the group
    /// @param _initialPrice The initial price of the NFT
    /// @param _reducingRate The reducing rate per hour
    /// @param _salePeriod The sale period of the NFT
    function listToDutchAuction(
        uint256 _id,
        uint256 _initialPrice,
        uint256 _reducingRate,
        uint256 _salePeriod
    ) external onlyDirector {
        require(_id <= numberOfNFT - 1 && _id >= 0, "NFT does not exist!");
        require(listedState[_id] == false, "Already listed!");
        require(
            _initialPrice > _reducingRate * (_salePeriod / 3600),
            "Invalid Dutch information!"
        );
        listedState[_id] = true;
        IERC721(collectionAddress).approve(marketplace, nftIdArr[_id]);
        IMarketplace(marketplace).listToDutchAuction(
            collectionAddress,
            nftIdArr[_id],
            _initialPrice,
            _reducingRate,
            _salePeriod
        );
        emit DutchAuctionListed(_id, _initialPrice, _reducingRate, _salePeriod);
    }

    /// @notice Function to list an NFT for an offering sale
    /// @param _id The id of the NFT in the group
    /// @param _initialPrice The initial price of the NFT
    function listToOfferingSale(
        uint256 _id,
        uint256 _initialPrice
    ) external onlyDirector {
        require(_id <= numberOfNFT - 1 && _id >= 0, "NFT does not exist!");
        require(listedState[_id] == false, "Already listed!");
        listedState[_id] = true;
        IERC721(collectionAddress).approve(marketplace, nftIdArr[_id]);
        IMarketplace(marketplace).listToOfferingSale(
            collectionAddress,
            nftIdArr[_id],
            _initialPrice
        );
        emit OfferingSaleListed(_id, _initialPrice);
    }

    /// @notice Function to cancel the listing of an NFT
    /// @param _id The id of the NFT in the group
    function cancelListing(uint256 _id) external onlyDirector {
        require(_id <= numberOfNFT - 1 && _id >= 0, "NFT does not exist!");
        require(listedState[_id] == true, "Not Listed!");
        IMarketplace(marketplace).cancelListing(
            collectionAddress,
            nftIdArr[_id]
        );
        listedState[_id] = false;
    }

    /// @notice Function to end an English auction
    /// @param _id The id of the NFT in the group
    function endEnglishAuction(uint256 _id) external onlyDirector {
        require(_id <= numberOfNFT - 1 && _id >= 0, "NFT does not exist!");
        require(listedState[_id] == true, "Not listed!");
        IMarketplace(marketplace).endEnglishAuction(
            collectionAddress,
            nftIdArr[_id]
        );
        emit EnglishAuctionEnded(_id);
    }

    /// @notice Function to submit an offering sale transaction
    /// @param _marketId The listed id of the NFT in the marketplace for offering sale
    /// @param _tokenId The id of the NFT in the NFT contract
    /// @param _buyer The buyer of the NFT
    /// @param _price The price of the NFT
    function submitOfferingSaleTransaction(
        uint256 _marketId,
        uint256 _tokenId,
        address _buyer,
        uint256 _price
    ) external onlyMarketplace {
        uint256 id = getNFTId[collectionAddress][_tokenId];
        require(listedState[id] == true, "Not listed");
        transactions_offering.push(
            transaction_offering(_marketId, id, _price, _buyer, false)
        );
        emit OfferingSaleTransactionProposed(
            collectionAddress,
            _tokenId,
            _buyer,
            _price
        );
    }

    /// @notice Function to execute an offering sale transaction
    /// @param _transactionId The index of the transaction to be executed
    function executeOfferingSaleTransaction(
        uint256 _transactionId
    ) external onlyDirector {
        require(
            _transactionId <= transactions_offering.length - 1 &&
                _transactionId >= 0,
            "Invalid transaction id"
        );
        transactions_offering[_transactionId].endState = true;
        for (uint256 i = 0; i < transactions_offering.length; ++i) {
            if (
                transactions_offering[i].id ==
                transactions_offering[_transactionId].id
            ) {
                transactions_offering[i].endState = true;
            }
        }
        address buyer = transactions_offering[_transactionId].buyer;
        IMarketplace(marketplace).endOfferingSale(
            transactions_offering[_transactionId].marketId,
            buyer
        );
        emit OfferingSaleTransactionExecuted(_transactionId);
    }

    /// @notice Function to set a new director
    /// @param _candidate The candidate of the director
    function setNewDirector(
        address _candidate
    ) external onlyMembers {
        director = _candidate;
        emit DirectorSettingExecuted(director);
    }

    /// @notice Function to burn a NFT
    /// @param _id The index of the NFT to be burned
    function executeBurnTransaction(
        uint256 _id
    ) external onlyMembers {
        address nftAddress = collectionAddress;
        uint256 tokenId = nftIdArr[_id];
        if (burnFee != 0) {
            SafeERC20.forceApprove(USDC_token, nftAddress, burnFee);
        }
        uint256 burnedId = IContentNFT(nftAddress).burn(tokenId);
        require(burnedId == tokenId, "Not match burned ID");
        nftIdArr[_id] = nftIdArr[numberOfNFT - 1];
        delete nftIdArr[numberOfNFT - 1];
        getNFTId[collectionAddress][nftIdArr[_id]] = _id;
        delete getNFTId[nftAddress][tokenId];
        numberOfNFT--;
        emit NFTBurned(_id);
    }

    /// @notice Function to set the team score
    /// @param _score Team score
    function setTeamScore(uint256 _score) external onlyFactory {
        require(_score >= 0 && _score <= 100, "Invalid score");
        teamScore = _score;
        emit TeamScoreSet(_score);
    }

    /// @notice Function to receive loyalty fee and distribute immediately automatically
    /// @param _nftId The id of the NFT
    /// @param _price The loyaltyFee for secondary sale
    function alarmLoyaltyFeeReceived(uint256 _nftId, uint256 _price) external {
        require(
            msg.sender == collectionAddress,
            "Invalid Alarm!"
        );
        uint256 id = getNFTId[msg.sender][_nftId];
        require(id <= numberOfNFT - 1 && id >= 0, "NFT does not exist!");
        require(listedState[id] == true, "Not listed");
        eachDistribution(id, _price);
        emit LoyaltyFeeReceived(id, _price);
    }

    /// @notice Function to handle a sold-out event
    /// @param _nftContractAddress The address of the contract that sold out NFT
    /// @param _nftId The Id of the token contract that sold out NFT
    /// @param _price The price of the sold out NFT
    function alarmSoldOut(
        address _nftContractAddress,
        uint256 _nftId,
        uint256 _price
    ) external onlyMarketplace {
        require(
            _nftContractAddress == collectionAddress,
            "Invalid Alarm!"
        );
        uint256 id = getNFTId[_nftContractAddress][_nftId];
        require(id <= numberOfNFT - 1 && id >= 0, "NFT does not exist!");
        require(listedState[id] == true, "Not listed");
        record_member[] memory temp = Recording[id];
        uint256 sum = 0;
        for (uint256 i = 0; i < temp.length; ++i) {
            uint256 value = IMarketplace(marketplace).getBalanceOfUser(
                temp[i]._member
            );
            Recording[id][i]._percent = value;
            sum += value;
        }
        for (uint256 i = 0; i < temp.length; ++i) {
            Recording[id][i]._sum = sum;
        }
        soldOutState[id] = true;
        soldInformation.push(soldInfor(id, _price, false));
    }

    /// @notice Function to withdraw funds from the marketplace
    function withdrawFromMarketplace() external onlyDirector {
        IMarketplace(marketplace).withdrawFromSeller();
        uint256 startNumber = currentDistributeNumber;
        for (uint256 i = startNumber; i < soldInformation.length; ++i) {
            if (!soldInformation[i].distributeState)
                eachDistribution(
                    soldInformation[i].id,
                    soldInformation[i].price
                );
            soldInformation[i].distributeState = true;
        }
        currentDistributeNumber = soldInformation.length;
        emit WithdrawalFromMarketplace();
    }

    /// @notice Function to withdraw funds from the contract
    function withdraw() external onlyMembers nonReentrant {
        uint256 balanceToWithdraw = balance[msg.sender];
        require(balanceToWithdraw != 0, "No balance to withdraw");
        balance[msg.sender] = 0;
        SafeERC20.safeTransfer(USDC_token, msg.sender, balanceToWithdraw);
        emit WithdrawHappened(msg.sender, balanceToWithdraw);
    }

    /// @notice Function to distribute revenue from sold NFTs
    /// @param _id NFT id in the group
    /// @param _value Earning Value
    function eachDistribution(uint256 _id, uint256 _value) internal {
        totalEarning += _value;
        uint256 count = Recording[_id].length;
        require(count != 0, "No members to distribute");
        uint256 eachTeamScore = ((_value * teamScore) / 100) / count;
        uint256 remainingValue = _value - eachTeamScore * count;
        uint256[] memory _revenues = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            _revenues[i] += eachTeamScore;
            if (Recording[_id][i]._sum == 0) {
                _revenues[i] += remainingValue / count;
            } else {
                _revenues[i] += (remainingValue * Recording[_id][i]._percent) /
                    Recording[_id][i]._sum;
            }
        }
        address[] memory _members = new address[](count);
        for (uint256 i = 0; i < count; ++i) {
            address tmp_address = Recording[_id][i]._member;
            revenueDistribution[tmp_address][_id] += _revenues[i];
            _members[i] = tmp_address;
            balance[tmp_address] += _revenues[i];
        }
        IMarketplace(marketplace).addBalanceOfUser(
            _members,
            _revenues,
            collectionAddress,
            nftIdArr[_id]
        );
    }


    /// @notice Function to get the NFT ID of a specific index
    /// @param index The index of the NFT ID to get
    /// @return The NFT ID of a specific index
    function getNftOfId(uint256 index) external view returns (uint256) {
        return nftIdArr[index];
    }

    /// @notice Function to get the revenue distribution for a member and NFT ID
    /// @param _member The address of the member
    /// @param id The id of the NFT in the group
    /// @return The revenue for a member and NFT ID
    function getRevenueDistribution(
        address _member,
        uint256 id
    ) external view returns (uint256) {
        return revenueDistribution[_member][id];
    }

    /// @notice Function to get the number of sold NFTs
    /// @return The number of sold NFTs
    function getSoldNumber() external view returns (uint256) {
        return soldInformation.length;
    }

    /// @notice Function to get information about a sold NFT at a specific index
    /// @param index The index of the sold NFT information to get
    /// @return The information about a sold NFT at a specific index
    function getSoldInfor(
        uint256 index
    ) external view returns (soldInfor memory) {
        return soldInformation[index];
    }
}
