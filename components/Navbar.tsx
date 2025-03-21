import { Pen } from 'lucide-react'
import React from 'react'

interface Props { }

const Navbar = () => {
  return <header className='w-full bg-transparent fixed z-10 px-5 py-3'>
    <nav className='w-full '>
      <h1 className='text-3xl to-indigo-200 text-white font-extrabold'><Pen />Writethisdown</h1>
    </nav>
  </header>
}

export default Navbar