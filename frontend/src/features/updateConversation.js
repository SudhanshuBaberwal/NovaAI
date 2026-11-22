import React from 'react'
import api from '../../utils/axios'

const updateConversation = async (payload) => {
  try {
    const {data} = await api.post("/api/chat/update-conversation",payload)
    return data;
  } catch (error) {
    console.log(error)
    return null;
  }
}

export default updateConversation
