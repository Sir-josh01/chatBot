import React, {useState} from 'react'
import ChatInput from './Components/ChatInput'
import ChatMessages from './Components/ChatMessages'
import "./App.css"


 function App() {
    const [chatMessages, setChatMessages] = useState([{
    message: 'hello chatbot',
    sender: 'user',
    id: 'id1'
  }, {
    message: 'hello! How can i help you?',
    sender: 'robot',
    id: 'id2'
  }, {
    message: 'Can you get me todays date',
    sender: 'user',
    id: 'id3'
  }, {
    message: 'Today is september 27',
    sender: 'robot', 
    id: 'id4'
  }]);
  

  return (
    <div className='app-container'>
        <ChatMessages  chatMessages={chatMessages} />

          <ChatInput chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        />
      </div>
    );
  }

export default App
