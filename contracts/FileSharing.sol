
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileSharing {
    struct FileInfo {
        address owner;
        mapping(address => bool) authorizedUsers;
        address[] userList;
        mapping(address => bool) blacklist;
        address[] blacklistArray;
        mapping(address => bool) whitelist;
        address[] whitelistArray;
        bool useWhitelist;
        bool exists;
    }
    
    mapping(string => FileInfo) private files;
    
    event FileUploaded(string indexed fileHash, address indexed owner);
    event AccessGranted(string indexed fileHash, address indexed user, address indexed grantedBy);
    event AccessRevoked(string indexed fileHash, address indexed user, address indexed revokedBy);
    event UserBlacklisted(string indexed fileHash, address indexed user, address indexed blacklistedBy);
    event UserRemovedFromBlacklist(string indexed fileHash, address indexed user, address indexed removedBy);
    event UserWhitelisted(string indexed fileHash, address indexed user, address indexed whitelistedBy);
    event UserRemovedFromWhitelist(string indexed fileHash, address indexed user, address indexed removedBy);
    event WhitelistModeToggled(string indexed fileHash, bool useWhitelist, address indexed toggledBy);
    
    modifier onlyFileOwner(string memory _fileHash) {
        require(files[_fileHash].exists, "File does not exist");
        require(files[_fileHash].owner == msg.sender, "Only file owner can perform this action");
        _;
    }
    
    modifier fileExists(string memory _fileHash) {
        require(files[_fileHash].exists, "File does not exist");
        _;
    }
    
    function uploadFile(string memory _fileHash) external {
        require(!files[_fileHash].exists, "File already exists");
        
        files[_fileHash].owner = msg.sender;
        files[_fileHash].exists = true;
        files[_fileHash].useWhitelist = false;
        // Owner automatically has access
        files[_fileHash].authorizedUsers[msg.sender] = true;
        files[_fileHash].userList.push(msg.sender);
        
        emit FileUploaded(_fileHash, msg.sender);
    }
    
    function grantAccess(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != address(0), "Invalid user address");
        require(!files[_fileHash].authorizedUsers[_user], "User already has access");
        require(!files[_fileHash].blacklist[_user], "User is blacklisted");
        
        files[_fileHash].authorizedUsers[_user] = true;
        files[_fileHash].userList.push(_user);
        
        emit AccessGranted(_fileHash, _user, msg.sender);
    }
    
    function revokeAccess(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != msg.sender, "Cannot revoke access from owner");
        require(files[_fileHash].authorizedUsers[_user], "User does not have access");
        
        files[_fileHash].authorizedUsers[_user] = false;
        
        // Remove from user list
        for (uint i = 0; i < files[_fileHash].userList.length; i++) {
            if (files[_fileHash].userList[i] == _user) {
                files[_fileHash].userList[i] = files[_fileHash].userList[files[_fileHash].userList.length - 1];
                files[_fileHash].userList.pop();
                break;
            }
        }
        
        emit AccessRevoked(_fileHash, _user, msg.sender);
    }
    
    function addToBlacklist(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != address(0), "Invalid user address");
        require(_user != msg.sender, "Cannot blacklist owner");
        require(!files[_fileHash].blacklist[_user], "User already blacklisted");
        
        files[_fileHash].blacklist[_user] = true;
        files[_fileHash].blacklistArray.push(_user);
        
        // Revoke access if user currently has it
        if (files[_fileHash].authorizedUsers[_user]) {
            files[_fileHash].authorizedUsers[_user] = false;
            // Remove from user list
            for (uint i = 0; i < files[_fileHash].userList.length; i++) {
                if (files[_fileHash].userList[i] == _user) {
                    files[_fileHash].userList[i] = files[_fileHash].userList[files[_fileHash].userList.length - 1];
                    files[_fileHash].userList.pop();
                    break;
                }
            }
        }
        
        emit UserBlacklisted(_fileHash, _user, msg.sender);
    }
    
    function removeFromBlacklist(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(files[_fileHash].blacklist[_user], "User is not blacklisted");
        
        files[_fileHash].blacklist[_user] = false;
        
        // Remove from blacklist array
        for (uint i = 0; i < files[_fileHash].blacklistArray.length; i++) {
            if (files[_fileHash].blacklistArray[i] == _user) {
                files[_fileHash].blacklistArray[i] = files[_fileHash].blacklistArray[files[_fileHash].blacklistArray.length - 1];
                files[_fileHash].blacklistArray.pop();
                break;
            }
        }
        
        emit UserRemovedFromBlacklist(_fileHash, _user, msg.sender);
    }
    
    function addToWhitelist(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != address(0), "Invalid user address");
        require(!files[_fileHash].whitelist[_user], "User already whitelisted");
        require(!files[_fileHash].blacklist[_user], "User is blacklisted");
        
        files[_fileHash].whitelist[_user] = true;
        files[_fileHash].whitelistArray.push(_user);
        
        emit UserWhitelisted(_fileHash, _user, msg.sender);
    }
    
    function removeFromWhitelist(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != msg.sender, "Cannot remove owner from whitelist");
        require(files[_fileHash].whitelist[_user], "User is not whitelisted");
        
        files[_fileHash].whitelist[_user] = false;
        
        // Remove from whitelist array
        for (uint i = 0; i < files[_fileHash].whitelistArray.length; i++) {
            if (files[_fileHash].whitelistArray[i] == _user) {
                files[_fileHash].whitelistArray[i] = files[_fileHash].whitelistArray[files[_fileHash].whitelistArray.length - 1];
                files[_fileHash].whitelistArray.pop();
                break;
            }
        }
        
        // Revoke access if whitelist mode is enabled and user is not on whitelist
        if (files[_fileHash].useWhitelist && files[_fileHash].authorizedUsers[_user]) {
            files[_fileHash].authorizedUsers[_user] = false;
            // Remove from user list
            for (uint i = 0; i < files[_fileHash].userList.length; i++) {
                if (files[_fileHash].userList[i] == _user) {
                    files[_fileHash].userList[i] = files[_fileHash].userList[files[_fileHash].userList.length - 1];
                    files[_fileHash].userList.pop();
                    break;
                }
            }
        }
        
        emit UserRemovedFromWhitelist(_fileHash, _user, msg.sender);
    }
    
    function toggleWhitelistMode(string memory _fileHash) external onlyFileOwner(_fileHash) {
        files[_fileHash].useWhitelist = !files[_fileHash].useWhitelist;
        
        emit WhitelistModeToggled(_fileHash, files[_fileHash].useWhitelist, msg.sender);
    }
    
    function hasAccess(string memory _fileHash, address _user) external view fileExists(_fileHash) returns (bool) {
        // Owner always has access
        if (files[_fileHash].owner == _user) {
            return true;
        }
        
        // Check if user is blacklisted
        if (files[_fileHash].blacklist[_user]) {
            return false;
        }
        
        // If whitelist mode is enabled, user must be whitelisted
        if (files[_fileHash].useWhitelist) {
            return files[_fileHash].whitelist[_user];
        }
        
        // Regular access check
        return files[_fileHash].authorizedUsers[_user];
    }
    
    function getFileOwner(string memory _fileHash) external view fileExists(_fileHash) returns (address) {
        return files[_fileHash].owner;
    }
    
    function getAuthorizedUsers(string memory _fileHash) external view fileExists(_fileHash) returns (address[] memory) {
        return files[_fileHash].userList;
    }
    
    function getBlacklistedUsers(string memory _fileHash) external view fileExists(_fileHash) returns (address[] memory) {
        return files[_fileHash].blacklistArray;
    }
    
    function getWhitelistedUsers(string memory _fileHash) external view fileExists(_fileHash) returns (address[] memory) {
        return files[_fileHash].whitelistArray;
    }
    
    function isWhitelistModeEnabled(string memory _fileHash) external view fileExists(_fileHash) returns (bool) {
        return files[_fileHash].useWhitelist;
    }
    
    function isFileRegistered(string memory _fileHash) external view returns (bool) {
        return files[_fileHash].exists;
    }
    
    function isUserBlacklisted(string memory _fileHash, address _user) external view fileExists(_fileHash) returns (bool) {
        return files[_fileHash].blacklist[_user];
    }
    
    function isUserWhitelisted(string memory _fileHash, address _user) external view fileExists(_fileHash) returns (bool) {
        return files[_fileHash].whitelist[_user];
    }
}
