import sys
import eventlet
eventlet.monkey_patch() # Must be first for eventlet concurrency
import logging
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room

# Configure high-verbosity logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('KERNEL')

app = Flask(__name__)
# High-concurrency socket engine
socketio = SocketIO(app, 
                    cors_allowed_origins="*", 
                    async_mode='eventlet', 
                    logger=True, 
                    engineio_logger=True,
                    ping_timeout=10, 
                    ping_interval=5)

# Thread-safe global state
class StateManager:
    def __init__(self):
        self.rooms = {} # {room_id: {'users': set(), 'history': []}}

    def add_user(self, room, sid):
        if room not in self.rooms: self.rooms[room] = {'users': set(), 'history': []}
        self.rooms[room]['users'].add(sid)

    def remove_user(self, sid):
        for room in self.rooms:
            if sid in self.rooms[room]['users']:
                self.rooms[room]['users'].remove(sid)
                return room
        return None

State = StateManager()

@socketio.on('connect')
def on_connect():
    logger.info(f"Client Handshake: {request.sid}")

@socketio.on('join')
def on_join(data):
    room = data.get('room')
    user = data.get('name')
    sid = request.sid
    join_room(room)
    State.add_user(room, sid)
    logger.info(f"User {user} joined {room}. Active: {len(State.rooms[room]['users'])}")
    emit('member_joined', {'name': user, 'id': sid, 'count': len(State.rooms[room]['users'])}, room=room)

@socketio.on('message')
def handle_message(data):
    # Stateful message relay
    room = data.get('room')
    State.rooms[room]['history'].append(data)
    emit('render_msg', data, room=room, include_self=True)
    logger.info(f"Relayed message in {room} from {data.get('name')}")

@socketio.on('ping')
def handle_ping(data):
    emit('pong', {'ts': data.get('ts')})

@socketio.on('telemetry_update')
def handle_telemetry(data):
    # Audit trail for hardware health
    logger.info(f"Telemetry from {request.sid}: {data}")

@socketio.on('disconnect')
def on_disconnect():
    room = State.remove_user(request.sid)
    if room:
        emit('update_room_count', len(State.rooms[room]['users']), room=room)
        logger.info(f"Client detached: {request.sid} from {room}")

# Robust health check route for Render
@app.route('/health')
def health_check():
    return jsonify({"status": "RUNNING", "threads": "eventlet"}), 200

if __name__ == '__main__':
    # Production-ready execution
    socketio.run(app, host='0.0.0.0', port=5000)