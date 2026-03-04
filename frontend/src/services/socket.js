import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  socket = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connecté');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket déconnecté');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Erreur WebSocket:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId) {
    if (this.socket) {
      this.socket.emit('join_group', groupId);
      console.log(`📢 Rejoint le groupe ${groupId}`);
    }
  }

  leaveGroup(groupId) {
    if (this.socket) {
      this.socket.emit('leave_group', groupId);
    }
  }

  onNewExpense(callback) {
    if (this.socket) {
      this.socket.on('new_expense_added', callback);
    }
  }

  onExpenseDeleted(callback) {
    if (this.socket) {
      this.socket.on('expense_deleted', callback);
    }
  }

  onMemberJoined(callback) {
    if (this.socket) {
      this.socket.on('member_joined', callback);
    }
  }

  onMemberRemoved(callback) {
    if (this.socket) {
      this.socket.on('member_removed', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.off('new_expense_added');
      this.socket.off('expense_deleted');
      this.socket.off('member_joined');
      this.socket.off('member_removed');
    }
  }
}

const socketService = new SocketService();
export default socketService;
