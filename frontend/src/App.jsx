import React from 'react'
import { useParams } from 'react-router-dom'
import Screen from './components/mainScreen/Screen'
import './App.css'

function App() {
  const { chatId } = useParams()

  return <Screen chatId={chatId} />
}

export default App