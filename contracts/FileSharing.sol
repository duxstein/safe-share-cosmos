
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileSharing {
    struct FileInfo {
        address owner;
        mapping(address => bool) authorizedUsers;
        address[] userList;
        bool exists;
    }
    
    mapping(string => FileInfo) private files;
    
    event FileUploaded(string indexed fileHash, address indexed owner);
    event AccessGranted(string indexed fileHash, address indexed user, address indexed grantedBy);
    event AccessRevoked(string indexed fileHash, address indexed user, address indexed revokedBy);
    
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
        // Owner automatically has access
        files[_fileHash].authorizedUsers[msg.sender] = true;
        files[_fileHash].userList.push(msg.sender);
        
        emit FileUploaded(_fileHash, msg.sender);
    }
    
    function grantAccess(string memory _fileHash, address _user) external onlyFileOwner(_fileHash) {
        require(_user != address(0), "Invalid user address");
        require(!files[_fileHash].authorizedUsers[_user], "User already has access");
        
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
    
    function hasAccess(string memory _fileHash, address _user) external view fileExists(_fileHash) returns (bool) {
        return files[_fileHash].authorizedUsers[_user];
    }
    
    function getFileOwner(string memory _fileHash) external view fileExists(_fileHash) returns (address) {
        return files[_fileHash].owner;
    }
    
    function getAuthorizedUsers(string memory _fileHash) external view fileExists(_fileHash) returns (address[] memory) {
        return files[_fileHash].userList;
    }
    
    function isFileRegistered(string memory _fileHash) external view returns (bool) {
        return files[_fileHash].exists;
    }
}
