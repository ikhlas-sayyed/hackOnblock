// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract Messager {

    struct User {
        address userAddress;
        string name;
        string username;
        string[] friends;
        uint256 joinAt;
        bool exists;
    }

    struct Invite {
        address sender;
        string message;
    }

    struct Friends {
        mapping(address => string) friendToRoomId;
        address[] friendList;
    }

    struct Message {
        address sender;
        string msgForReceiver;
        string msgForSender;
        uint256 time;
    }

    struct Room {
        string roomId;
        address user1;
        address user2;
        Message[] messages;
        uint256 createdAt;
        bool exists;
    }

    mapping(address => User) public users;
    mapping(string => User) public usersByUsername;
    mapping(address => Invite[]) private invites;
    mapping(address => Friends) private userFriends;
    mapping(string => Room) public rooms;

    // Create User
    function createAccount(string memory _name, string memory _username) public {
        require(!usersByUsername[_username].exists, "Username already exists");
        require(!users[msg.sender].exists, "This wallet already has an account");

        string[] memory friends;
        User memory newUser = User({
            userAddress: msg.sender,
            name: _name,
            username: _username,
            friends: friends,
            joinAt: block.timestamp,
            exists: true
        });

        users[msg.sender] = newUser;
        usersByUsername[_username] = newUser;
    }

    // Send Invite
    function sendInvite(address _user, string memory inviteMsg) public {
        require(users[_user].exists, "User does not exist");
        require(!isFriend(msg.sender, _user), "You are already friends with this user");

        Invite[] storage userInvites = invites[_user];
        for (uint256 i = 0; i < userInvites.length; i++) {
            require(userInvites[i].sender != msg.sender, "Invite already sent");
        }

        invites[_user].push(Invite({
            sender: msg.sender,
            message: inviteMsg
        }));
    }

    // Accept Invite
    function acceptInvite(address _user) public {
        Invite[] storage userInvites = invites[msg.sender];
        bool inviteFound = false;
        for (uint256 i = 0; i < userInvites.length; i++) {
            if (userInvites[i].sender == _user) {
                inviteFound = true;
                userInvites[i] = userInvites[userInvites.length - 1];
                userInvites.pop();
                break;
            }
        }
        require(inviteFound, "Invite does not exist");

        string memory roomId = string(abi.encodePacked(msg.sender, _user));

        if (!isFriend(msg.sender, _user)) {
            userFriends[msg.sender].friendList.push(_user);
            userFriends[_user].friendList.push(msg.sender);

            userFriends[msg.sender].friendToRoomId[_user] = roomId;
            userFriends[_user].friendToRoomId[msg.sender] = roomId;

            users[msg.sender].friends.push(users[_user].username);
            users[_user].friends.push(users[msg.sender].username);
        }

        Room memory newRoom = Room({
            roomId: roomId,
            user1: msg.sender,
            user2: _user,
            messages: new Message , // Initialize with an empty array
            createdAt: block.timestamp,
            exists: true
        });
        rooms[roomId] = newRoom;
    }

    // Send Message
    function sendMessage(string memory _roomId, string memory msgForReceiver, string memory msgForSender) public {
        require(rooms[_roomId].exists, "Room does not exist");
        require(rooms[_roomId].user1 == msg.sender || rooms[_roomId].user2 == msg.sender, "You do not have access to this room");

        Message memory newMessage = Message({
            sender: msg.sender,
            msgForReceiver: msgForReceiver,
            msgForSender: msgForSender,
            time: block.timestamp
        });

        rooms[_roomId].messages.push(newMessage);
    }

    function isFriend(address user, address potentialFriend) public view returns (bool) {
        Friends storage friends = userFriends[user];
        for (uint256 i = 0; i < friends.friendList.length; i++) {
            if (friends.friendList[i] == potentialFriend) {
                return true;
            }
        }
        return false;
    }

    // Getter for invites (if needed)
    function getInvites(address _user) public view returns (Invite[] memory) {
        return invites[_user];
    }

    // Getter for friends (if needed)
    function getFriends(address _user) public view returns (address[] memory) {
        return userFriends[_user].friendList;
    }
}
