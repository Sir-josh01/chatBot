import React from 'react' 
import '../Components/ChatMessage.css'


 function ChatMessage({message, sender}) {

      return (
      <div className={
        sender === 'user'
        ? 'chat-message-user'
        : 'chat-message-robot'
      }>
        {sender === 'robot' && <img src="images/robot.png" className='chat-message-profile' />}
        <div className='chat-message-text'>
          {message}
        </div>
        {sender === 'user' && <img src="images/user.png" className='chat-message-profile' />} 
      </div>
    );
  } 

  export default ChatMessage