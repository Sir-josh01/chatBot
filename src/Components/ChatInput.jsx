import React, {useState} from 'react'
import Chatbot from 'supersimpledev'
import '../Components/ChatInput.css'

 function ChatInput({ chatMessages, setChatMessages }) {
  const [inputText, setInputText] = useState('');

    function saveInputText(event) {
      setInputText(event.target.value);
    }

    async function sendMessage() {
      if(!inputText.trim()) return;

      const newMessages = [
      ...chatMessages,
      {message: inputText,
        sender: 'user',
        id: crypto.randomUUID()
      }
     ]
     setChatMessages(newMessages)

     const response = await Chatbot.getResponseAsync(inputText);
      setChatMessages([
      ...newMessages,
      {message: response,
        sender: 'robot',
        id: crypto.randomUUID()
      }
     ]);
     setInputText('');
    }

    async function useEnter(event) {
      if (event.key === 'Enter') {
        await sendMessage();
    } else if (event.key === 'Escape') {
          setInputText('');
        }
   };

    return (
      <div className='chat-input-container'>
        <input 
           type='text'
           placeholder="Send a message to chatbot"
           size="30"
           onChange={saveInputText}
           value={inputText}
           className='chat-input'
           onKeyDown={useEnter}
           />
        <button 
          onClick={sendMessage}
          className='send-button'
        >Send</button>
      </div>
      );
  }
export default ChatInput