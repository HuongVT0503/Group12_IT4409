import { getSession, neo4j } from "../config/neo4j.js";

async function getOrCreateConversation(userId1, userId2, conversationId) {
  const session = getSession();
  try {
    const query = `
      MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
      MERGE (conv:Conversation {participants: [$userId1, $userId2]})
      ON CREATE SET conv.id = $conversationId, conv.created_at = datetime()
      MERGE (u1)-[:IN_CONVERSATION]->(conv)
      MERGE (u2)-[:IN_CONVERSATION]->(conv)
      RETURN conv, u1, u2
    `;

    const result = await session.run(query, {
      userId1,
      userId2,
      conversationId,
    });

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const conversation = record.get("conv").properties;

    if (conversation.created_at && conversation.created_at.toString) {
      conversation.created_at = new Date(
        conversation.created_at.toString()
      ).toISOString();
    }

    return conversation;
  } finally {
    await session.close();
  }
}

async function getUserConversations(userId) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:IN_CONVERSATION]->(conv:Conversation)
      WITH conv, u
      UNWIND conv.participants AS participantId
      MATCH (participant:User {id: participantId})
      WHERE participantId <> u.id
      WITH conv, participant, u
      OPTIONAL MATCH (conv)<-[:BELONGS_TO]-(msg:Message)
      OPTIONAL MATCH (sender:User)-[:SENT]->(msg)
      WITH conv, participant, msg, sender
      ORDER BY msg.created_at DESC

      WITH conv, participant, collect({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender: { id: sender.id } 
      }) AS messages
      WITH conv, participant, messages[0] AS lastMessage
      WHERE lastMessage.id IS NOT NULL
      RETURN {
        id: conv.id,
        participants: conv.participants,
        otherUser: {
          id: participant.id,
          username: participant.username,
          display_name: participant.display_name,
          avatar_url: participant.avatar_url
        },
        lastMessage: lastMessage,
        updated_at: CASE WHEN lastMessage IS NOT NULL THEN lastMessage.created_at ELSE conv.created_at END
      } AS conversation
      ORDER BY conversation.updated_at DESC
    `;

    const result = await session.run(query, { userId });
    const conversations = result.records.map((r) => {
      const conv = r.get("conversation");

      if (conv.updated_at) {
        conv.updated_at = new Date(conv.updated_at.toString()).toISOString();
      }

      if (conv.lastMessage && conv.lastMessage.created_at) {
        conv.lastMessage.created_at = new Date(
          conv.lastMessage.created_at.toString()
        ).toISOString();
      }

      return conv;
    });

    return conversations;
  } finally {
    await session.close();
  }
}

async function createMessage({
  id,
  conversationId,
  senderId,
  content,
  mediaUrl = null,
}) {
  const session = getSession();
  try {
    const query = `
      MATCH (sender:User {id: $senderId})
      MATCH (conv:Conversation {id: $conversationId})
      CREATE (msg:Message {
        id: $id,
        content: $content,
        mediaUrl: $mediaUrl,
        created_at: datetime(),
        is_read: false
      })
      CREATE (sender)-[:SENT]->(msg)
      CREATE (msg)-[:BELONGS_TO]->(conv)
      RETURN msg, sender
    `;

    const result = await session.run(query, {
      id,
      conversationId,
      senderId,
      content,
      mediaUrl,
    });

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const message = record.get("msg").properties;
    const sender = record.get("sender").properties;

    if (message.created_at)
      message.created_at = new Date(message.created_at).toISOString();

    return { message, sender };
  } finally {
    await session.close();
  }
}

async function getConversationMessages(conversationId, limit = 50, offset = 0) {
  const session = getSession();
  try {
    const query = `
      MATCH (msg:Message)-[:BELONGS_TO]->(conv:Conversation {id: $conversationId})
      MATCH (sender:User)-[:SENT]->(msg)
      WITH msg, sender
      ORDER BY msg.created_at DESC
      SKIP $offset
      LIMIT $limit
      RETURN {
        id: msg.id,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        sender: {
          id: sender.id,
          username: sender.username,
          display_name: sender.display_name,
          avatar_url: sender.avatar_url
        },
        created_at: msg.created_at,
        is_read: msg.is_read
      } AS message
      ORDER BY message.created_at ASC
    `;

    const result = await session.run(query, {
      conversationId,
      limit: neo4j.int(limit),
      offset: neo4j.int(offset),
    });

    const messages = result.records.map((r) => {
      const msg = r.get("message");
      if (msg.created_at)
        msg.created_at = new Date(msg.created_at.toString()).toISOString();
      return msg;
    });

    return messages;
  } finally {
    await session.close();
  }
}

async function markMessageAsRead(messageId) {
  const session = getSession();
  try {
    const query = `
      MATCH (msg:Message {id: $messageId})
      SET msg.is_read = true
      RETURN msg
    `;

    const result = await session.run(query, { messageId });

    if (result.records.length === 0) return null;

    const message = result.records[0].get("msg").properties;
    return message;
  } finally {
    await session.close();
  }
}

async function markConversationAsRead(conversationId, userId) {
  const session = getSession();
  try {
    const query = `
      MATCH (msg:Message)-[:BELONGS_TO]->(conv:Conversation {id: $conversationId})
      MATCH (sender:User)-[:SENT]->(msg)
      WHERE sender.id <> $userId
      SET msg.is_read = true
      RETURN count(msg) AS readCount
    `;

    const result = await session.run(query, { conversationId, userId });

    if (result.records.length === 0) return 0;

    return result.records[0].get("readCount").toNumber();
  } finally {
    await session.close();
  }
}

async function deleteMessage(messageId, userId) {
  const session = getSession();
  try {
    const query = `
      MATCH (sender:User {id: $userId})-[:SENT]->(msg:Message {id: $messageId})
      DETACH DELETE msg
      RETURN 1
    `;

    const result = await session.run(query, { messageId, userId });

    return result.records.length > 0;
  } finally {
    await session.close();
  }
}

async function getUnreadMessageCount(userId) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:IN_CONVERSATION]->(conv:Conversation)
      MATCH (conv)<-[:BELONGS_TO]-(msg:Message)
      MATCH (sender:User)-[:SENT]->(msg)
      WHERE msg.is_read = false AND sender.id <> $userId
      RETURN count(msg) AS unreadCount
    `;

    const result = await session.run(query, { userId });

    if (result.records.length === 0) return 0;

    return result.records[0].get("unreadCount").toNumber();
  } finally {
    await session.close();
  }
}

async function findConversationById(conversationId) {
  const session = getSession();
  try {
    const query = `
      MATCH (conv:Conversation {id: $conversationId})
      RETURN conv
    `;

    const result = await session.run(query, { conversationId });

    if (result.records.length === 0) return null;

    return result.records[0].get("conv").properties;
  } finally {
    await session.close();
  }
}

async function findConversationByUsers(userId1, userId2) {
  const session = getSession();
  try {
    const query = `
      MATCH (u1:User {id: $userId1})-[:IN_CONVERSATION]->(conv:Conversation)<-[:IN_CONVERSATION]-(u2:User {id: $userId2})
      RETURN conv
    `;

    const result = await session.run(query, { userId1, userId2 });

    if (result.records.length === 0) return null;

    return result.records[0].get("conv").properties;
  } finally {
    await session.close();
  }
}

export {
  getOrCreateConversation,
  getUserConversations,
  createMessage,
  getConversationMessages,
  markMessageAsRead,
  markConversationAsRead,
  deleteMessage,
  getUnreadMessageCount,
  findConversationById,
  findConversationByUsers,
};
