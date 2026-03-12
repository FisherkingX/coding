from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room, emit

app = Flask(__name__)
socketio = SocketIO(app)

# This route now targets the file you actually have (index.html)
@app.route('/<room_id>')
def room(room_id):
    return render_template('index.html', roomId=room_id)

@socketio.on('join-room')
def handle_join_room(room_id, peer_id):
    join_room(room_id)
    emit('user-connected', peer_id, room=room_id, skip_sid=request.sid)

@socketio.on('message')
def handle_message(data):
    emit('createMessage', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)