import React from 'react'

const Login = () => {
  return (
    <div className='bg-gray-300 h-[500px] flex align-middle justify-center'>
        <form className='m-auto'>
            <div>
                <input type='text' placeholder='Name'/>
            </div>
            <div>
                <input type='email' placeholder='e-mail'/>
            </div>
            <div>
                <input type='password' placeholder='Password'/>
            </div>
        </form>
    </div>
  )
}

export default Login