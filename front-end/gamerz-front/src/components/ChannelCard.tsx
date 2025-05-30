import { Link } from "react-router-dom";

function ChannelCard({_id, channelName, connectedUsers }: {_id: string, channelName: string; connectedUsers: number }) {
    return (
        <>
        <li className='relative flex w-full gap-4  bg-[#3F6965] rounded-[20px] hover:transition'>
                       
                       <Link to={'/'} className='w-30 overflow-hidden rounded-left-[20px]'>
                            <img src="/thumbnail.png" alt="Valorant" className='object-cover rounded-l-[20px] my-auto w-30 h-full' />
                        </Link>
                        <div className='flex flex-col px-2 py-3'>
                            <div className='w-full'>
                                <Link to={'/'} className='font-semibold md:text-4xl text-[#F1E1A7]'>
                                    <h3>{channelName}</h3>
                                </Link>
                                <p className='text-sm text-white '>
                                {connectedUsers} joueurs
                                </p>
                            </div>
                            <div className='flex items-left justify-left mt-1 gap-1'>
                                <div className='mt-1 text-sm text-gray-900 bg-[#1EDCB3] rounded-full px-6 py-1'>
                                <Link to={`/Channel/${_id}`}>  
                                Rejoindre</Link>
                                </div>
                                
                            </div>
                        </div>
                    </li>


     </>
   
    );
}

export default ChannelCard;
