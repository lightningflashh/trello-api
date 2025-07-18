export const inviteUserToBoardSocket = (socket) => {
  // lắng nghe sự kiện từ client emit FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', invitation => {
    // Khi có người dùng được mời vào board, server sẽ phát sự kiện này đến tất cả các client khác
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}