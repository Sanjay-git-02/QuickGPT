import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UseAppContext } from '../context/Context'
 

const Loading = () => {

  const navigate = useNavigate()
  const { fetchUser} = UseAppContext();

  useEffect(()=>{
    const timeout = setTimeout(()=>{
      fetchUser();
      navigate("/")
    },4000)
    return ()=>clearTimeout(timeout)
  },[])

  return (
    <div className='bg-linear-to-b from-[#531B81] to-[#29184B] backdrop-opacity-60 flex justify-center items-center h-screen w-screen text-white text-2xl'>
      <div className='w-10 h-10 border-3 rounded-full border-white border-t-transparent animate-spin'></div>
    </div>
  )
}

export default Loading