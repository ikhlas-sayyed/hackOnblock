const Messager = artifacts.require("Messager");

contract("Messager", (accounts) => {
    const [owner, addr1, addr2, ...addrs] = accounts;

    let messager;

    beforeEach(async () => {
        messager = await Messager.new();
    });

    it("Should create an account", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        const user = await messager.users(addr1);
        assert.equal(user.name, "Alice");
        assert.equal(user.username, "alice123");
        assert.equal(user.exists, true);
    });

    it("Should not create an account with an existing username", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        try {
            await messager.createAccount("Bob", "alice123", { from: addr2 });
            assert.fail("Expected error not received");
        } catch (error) {
            assert(error.message.includes("Username already exists"), `Unexpected error message: ${error.message}`);
        }
    });

    it("Should send an invite", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        await messager.createAccount("Bob", "bob123", { from: addr2 });

        await messager.sendInvite(addr2, "Hi Bob!", { from: addr1 });

        const invites = await messager.getInvites(addr2);
        assert.equal(invites.length, 1);
        assert.equal(invites[0].sender, addr1);
        assert.equal(invites[0].message, "Hi Bob!");
    });

    it("Should not send an invite to a non-existent user", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        try {
            await messager.sendInvite(addr2, "Hi Bob!", { from: addr1 });
            assert.fail("Expected error not received");
        } catch (error) {
            assert(error.message.includes("User does not exist"), `Unexpected error message: ${error.message}`);
        }
    });

    it("Should accept an invite", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        await messager.createAccount("Bob", "bob123", { from: addr2 });

        await messager.sendInvite(addr2, "Hi Bob!", { from: addr1 });
        await messager.acceptInvite(addr1, { from: addr2 });

        const friendsOfAddr1 = await messager.getFriends(addr1);
        const friendsOfAddr2 = await messager.getFriends(addr2);

        assert.equal(friendsOfAddr1.length, 1);
        assert.equal(friendsOfAddr1[0], addr2);

        assert.equal(friendsOfAddr2.length, 1);
        assert.equal(friendsOfAddr2[0], addr1);
    });

    it("Should send a message in a room", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        await messager.createAccount("Bob", "bob123", { from: addr2 });

        await messager.sendInvite(addr2, "Hi Bob!", { from: addr1 });
        await messager.acceptInvite(addr1, { from: addr2 });

        const roomId = await messager.userFriends(addr1).friendToRoomId(addr2);

        await messager.sendMessage(roomId, "Hello Bob!", "Hello Alice!", { from: addr1 });

        const room = await messager.rooms(roomId);
        assert.equal(room.messages.length, 1);
        assert.equal(room.messages[0].msgForReceiver, "Hello Bob!");
        assert.equal(room.messages[0].msgForSender, "Hello Alice!");
    });

    it("Should not send a message to a non-existent room", async () => {
        try {
            await messager.sendMessage("nonExistentRoom", "Hello", "Hello", { from: addr1 });
            assert.fail("Expected error not received");
        } catch (error) {
            assert(error.message.includes("Room does not exist"), `Unexpected error message: ${error.message}`);
        }
    });

    it("Should not send a message from a non-participant", async () => {
        await messager.createAccount("Alice", "alice123", { from: addr1 });
        await messager.createAccount("Bob", "bob123", { from: addr2 });

        await messager.sendInvite(addr2, "Hi Bob!", { from: addr1 });
        await messager.acceptInvite(addr1, { from: addr2 });

        const roomId = await messager.userFriends(addr1).friendToRoomId(addr2);

        try {
            await messager.sendMessage(roomId, "Hello", "Hello", { from: addrs[0] });
            assert.fail("Expected error not received");
        } catch (error) {
            assert(error.message.includes("You do not have access to this room"), `Unexpected error message: ${error.message}`);
        }
    });
});
