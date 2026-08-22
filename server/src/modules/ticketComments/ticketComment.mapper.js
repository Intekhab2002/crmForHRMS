export function mapTicketComment(comment) {
    if (!comment) {
        return null;
    }

    return {
        id: comment.id,
        ticketId: comment.ticket_id,
        userId: comment.user_id,

        comment: comment.comment,

        author: {
            id: comment.user_id,
            username: comment.username ?? "",
            email: comment.email ?? "",
        },

        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
    };
}

export function mapTicketComments(comments) {
    if (!Array.isArray(comments)) {
        return [];
    }

    return comments
        .map(mapTicketComment)
        .filter(Boolean);
}