const Messager = artifacts.require("Messager");

contract("Messager", (accounts) => {
  let messager;

  const user1 = accounts[0];
  const user2 = accounts[1];
  const user1Name = "Alice";
  const user1Username = "alice";
  const user2Name = "Bob";
  const user2Username = "bob";
  const inviteMessage = "Let's be friends!";
  const roomMessage = "Hello!";
  const roomMessageForSender = "You sent a message!";

  before(async () => {
    messager = await Messager.deployed();
  });

  it("should create accounts", async () => {
    await messager.createAccount(user1Name, user1Username, { from: user1 });
    await messager.createAccount(user2Name, user2Username, { from: user2 });

    const user1Data = await messager.userFromAddress(user1);
    const user2Data = await messager.userFromAddress(user2);

    assert.equal(user1Data.name, user1Name, "User 1 name should be correct");
    assert.equal(user1Data.username, user1Username, "User 1 username should be correct");
    assert.equal(user2Data.name, user2Name, "User 2 name should be correct");
    assert.equal(user2Data.username, user2Username, "User 2 username should be correct");
  });

  it("should send and accept friend invite", async () => {
    await messager.sendInvite(user2, inviteMessage, { from: user1 });
    await messager.acceptInvite(user1, { from: user2 });

    const user1Friends = await messager.userFromAddress(user1);
    const user2Friends = await messager.userFromAddress(user2);

    assert.equal(user1Friends.friends[0], user2, "User 1 should have User 2 as friend");
    assert.equal(user2Friends.friends[0], user1, "User 2 should have User 1 as friend");

    const roomId = await messager.userFriends(user1).friendToRoomID(user2);
    assert(roomId, "Room ID should exist between User 1 and User 2");
  });

  it("should send a message in the room", async () => {
    const roomId = await messager.userFriends(user1).friendToRoomID(user2);
    await messager.sendMessage(roomId, roomMessage, roomMessageForSender, { from: user1 });

    const roomData = await messager.rooms(roomId);
    const lastMessage = roomData.messages[roomData.messages.length - 1];

    assert.equal(lastMessage.sender, user1, "Sender should be User 1");
    assert.equal(lastMessage.msg_for_receiver, roomMessage, "Message for receiver should be correct");
    assert.equal(lastMessage.msg_for_sender, roomMessageForSender, "Message for sender should be correct");
  });

  it("should send multiple messages", async () => {
    const roomId = await messager.userFriends(user1).friendToRoomID(user2);

    const messages = [
      { roomId, msg_for_receiver: "Hi Bob!", msg_for_sender: "You sent: Hi Bob!" },
      { roomId, msg_for_receiver: "How are you?", msg_for_sender: "You sent: How are you?" }
    ];

    await messager.sendMultipuleMessage(messages, { from: user1 });

    const roomData = await messager.rooms(roomId);
    const lastMessageIndex = roomData.messages.length - 1;
    const secondLastMessage = roomData.messages[lastMessageIndex - 1];
    const lastMessage = roomData.messages[lastMessageIndex];

    assert.equal(secondLastMessage.msg_for_receiver, "Hi Bob!", "Second last message should be correct");
    assert.equal(lastMessage.msg_for_receiver, "How are you?", "Last message should be correct");
  });
});
