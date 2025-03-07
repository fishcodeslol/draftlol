import { useEffect, useState } from 'react'
import '../Pages/draft-styles.css'
import { DraftList,isTimer} from '../App/Types/champ-select-types'
import { BASE_URL } from '../App/Slices/baseurl'
import {useWebSocket} from 'react-use-websocket/dist/lib/use-websocket'
import { ReadyState } from 'react-use-websocket'
import { useGetListQuery} from '../App/Slices/apiSlice'
import {initialDraftList} from '../App/InitialStates/initialDraftList'
import { CountdownTimer } from '../Components/CountdownTimer'

export const RedDraft = () => {
  const {data:draftData, error:draftError, isLoading:draftIsLoading, isSuccess:draftIsSuccess} = useGetListQuery('draftlist/')

  useEffect(()=>{
    if (draftIsSuccess===true && draftData.champList!==undefined){  
      setNewDraft(draftData)
    }
    else{}
  },[draftIsSuccess])
  
  const [newDraft, setNewDraft] = useState<DraftList>(initialDraftList)
  const [outgoingDraft, setOutgoingDraft] = useState<DraftList|null>(null)
  const [currentSelection, setCurrentSelection] = useState<string[]|null>(null)

  const {sendMessage, lastMessage, readyState} = useWebSocket(BASE_URL, {
    onOpen: () => console.log('connection opened'),
    onClose: () => console.log('connection closed'),
    onMessage: (message:WebSocketEventMap['message']) => {
      const data:DraftList = JSON.parse(message.data);
      if(!isTimer(data)){
        setNewDraft(data)
      }
    },
    share:true, ///maybe share should be false
    retryOnError: true,
    shouldReconnect: () => true
  })

  const [pickIndex,setPickIndex] = useState(0)
  const [banIndex,setBanIndex] = useState(0)
  const [banPhase,setBanPhase] = useState(true)
  
  useEffect(()=>{
    if (banIndex === 3 && pickIndex < 3 ){setBanPhase(false)}
    else if (banIndex === 3 && pickIndex == 3 ){setBanPhase(true)}
    else if (banIndex === 5 && pickIndex == 3 ){setBanPhase(false)}
    
    if (readyState === ReadyState.OPEN && outgoingDraft!==null) {    
      sendMessage(JSON.stringify(outgoingDraft))
      console.log(outgoingDraft.blueTurn)
    }
  },[readyState, outgoingDraft])

  const handleConfirm = () => {
    if (currentSelection!==null){
      const newDraftList = {...newDraft,
      blueTurn: true,
      champList:[...newDraft.champList.filter((item)=>item[0]!==currentSelection[0])],
      topList: [...newDraft.topList.filter((item)=>item[0]!==currentSelection[0])],
      jgList:[...newDraft.jgList.filter((item)=>item[0]!==currentSelection[0])],
      midList:[...newDraft.midList.filter((item)=>item[0]!==currentSelection[0])],
      bottomList:[...newDraft.bottomList.filter((item)=>item[0]!==currentSelection[0])],
      supportList:[...newDraft.supportList.filter((item)=>item[0]!==currentSelection[0])],
      }

      setNewDraft(newDraftList)
      setOutgoingDraft(newDraftList)  
      sendMessage(JSON.stringify({seconds:60}))
    }
    
    if (banPhase == false&&newDraft.blueSummonerlist!==null){
      if (newDraft.blueSummonerlist[pickIndex].name !==null) {
        setPickIndex(pickIndex+1)
      }
    }
    else if (newDraft.blueBanlist!==null) {
      if (newDraft.blueBanlist[banIndex].champ!==null) {
        setBanIndex(banIndex+1)
      }
    }
  }

  const ChampSelect = () => {
    const [champList,setChampList] = useState(newDraft.champList) 
    const [input,setInput] = useState('')
    const [laneView,setLaneView] = useState('ALL')
    
    useEffect(()=>{
      if (laneView==='TOP') {setChampList(newDraft.topList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
      else if (laneView==='JUNGLE') {setChampList(newDraft.jgList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
      else if (laneView==='MID') {setChampList(newDraft.midList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
      else if (laneView==='BOTTOM') {setChampList(newDraft.bottomList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
      else if (laneView==='SUPPORT') {setChampList(newDraft.supportList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
      else {setChampList(newDraft.champList.filter(array => array[0].toLowerCase().includes(input.toLowerCase())))}
    },[input])

    const handleSearch = (search:any) => {
      setInput(search)
      console.log(input)
    }

    const LaneSelect = () => {     
      return(
        <div className='lane-select'>
          <input type='button' value={'ALL'} onClick={()=>{setChampList(newDraft.champList);setLaneView('ALL')}}/>
          <input type='button' value={'TOP'} onClick={()=>{setChampList(newDraft.topList);setLaneView('TOP')}}/>
          <input type='button' value={'JUNGLE'} onClick={()=>{setChampList(newDraft.jgList);setLaneView('JUNGLE')}}/>
          <input type='button' value={'MIDDLE'} onClick={()=>{setChampList(newDraft.midList);setLaneView('MIDDLE')}}/>
          <input type='button' value={'BOTTOM'} onClick={()=>{setChampList(newDraft.bottomList);setLaneView('BOTTOM')}}/>
          <input type='button' value={'SUPPORT'} onClick={()=>{setChampList(newDraft.supportList);setLaneView('SUPPORT')}}/>
       </div>
      )
    }

    const handleChampSelect = (item:string[]) => {  
      setCurrentSelection(item)
      if(
        newDraft.blueBanlist!=null
        &&newDraft.blueSummonerlist!=null
        &&newDraft.redBanlist!=null
        &&newDraft.redSummonerlist!=null){
        
        let draft:DraftList = {...newDraft}

      if (banPhase==false) {
        draft.redSummonerlist[pickIndex] = {name: '',champ:item[0],icon:item[1]}
        setOutgoingDraft(draft)
  
      }
      else if (banPhase==true){
        draft.redBanlist[banIndex] = {champ:item[0],icon:item[1]}
        setOutgoingDraft(draft)
      }}
    }
    
    const ChampList = () => {
      return(
          <div className='champ-list'>
            {champList.map((item)=>{
              return(
                <div 
                  className='champion' 
                  key={item[0]} id={item[0]} 
                  onClick={()=>{if(newDraft.blueTurn===false){handleChampSelect(item)}}}>
                  <img src={item[1]} alt=''/>
                </div>)}
              )
            }
          </div>)}

    return (
      <div className='champ-select'>
        <input className='search-bar' type='text'  placeholder='Find Champion...' value={input} onChange={(e)=>{handleSearch(e.target.value)}}/>
        <LaneSelect/>
        <ChampList/>
      </div>
    )
  }

  const RoleSelect = () => {
    return(
      <div className='role-select'>
        <select>
          <option value="" disabled selected hidden>Select Role...</option>
          <option value='blue-top'>Top</option>
          <option value='blue-jg'>Jungle</option>
          <option value='blue-mid'>Middle</option>
          <option value='blue-adc'>Bottom</option>
          <option value='blue-sup'>Support</option>
        </select>
    </div>
    )
  }
  const BlueSideDraft = () => {
    if (draftIsLoading){
      return(<></>)

    }
    if (draftIsSuccess) {
      return(
        <div className="blue-side">
          <div className='blue-summoner-1'>
            <img className='champselect-image' src={newDraft.blueSummonerlist[0].icon} alt=''/>
          </div>
          <div className='blue-summoner-2'>
            <img className='champselect-image' src={newDraft.blueSummonerlist[1].icon} alt=''/>
          </div>
          <div className='blue-summoner-3'>
            <img className='champselect-image' src={newDraft.blueSummonerlist[2].icon} alt=''/>
          </div>
          <div className='blue-summoner-4'>
            <img className='champselect-image' src={newDraft.blueSummonerlist[3].icon} alt=''/>   
          </div>
          <div className='blue-summoner-5'>
            <img className='champselect-image' src={newDraft.blueSummonerlist[4].icon} alt=''/>
          </div>
        </div>
      )
    }
    else{
      return(<></>)
    }
  }
  const BlueSideBans = () => {
    if (draftIsLoading){
      return(<></>)
    }
    else if (draftIsSuccess){
      return(
        <div className='blue-side-bans'>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.blueBanlist[0].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.blueBanlist[1].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.blueBanlist[2].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.blueBanlist[3].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.blueBanlist[4].icon} alt=''/>
          </span>
        </div>
      )}
    else{
      return(null)
    }
    
  }

  const RedSideBans = () => {
    if (draftIsLoading){
      return(<></>)
    }
    else if (draftIsSuccess){
      return(
        <div className='red-side-bans'>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.redBanlist[4].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.redBanlist[3].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.redBanlist[2].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.redBanlist[1].icon} alt=''/>
          </span>
          <span className='ban-image-wrapper'>
            <img className='ban-image' src={newDraft.redBanlist[0].icon} alt=''/>
          </span>
        </div>
      )}
    else{
      return(null)
    }
    
  }

  const RedSideDraft = () => {
    if (draftIsLoading){
      return(<></>)
    }
    if (draftIsSuccess) {
      return(
        <div className="red-side">
        <div className='red-summoner-1'>
          <RoleSelect/>
          <img className='champselect-image' src={newDraft.redSummonerlist[0].icon} alt=''/>
        </div>
        <div className='red-summoner-2'>
          <RoleSelect/>
          <img className='champselect-image' src={newDraft.redSummonerlist[1].icon} alt=''/>
        </div>
        <div className='red-summoner-3'>
          <RoleSelect/>
          <img className='champselect-image' src={newDraft.redSummonerlist[2].icon} alt=''/>
        </div>
        <div className='red-summoner-4'>
          <RoleSelect/>
        <img className='champselect-image' src={newDraft.redSummonerlist[3].icon} alt=''/>   
        </div>
        <div className='red-summoner-5'>
          <RoleSelect/>
          <img className='champselect-image' src={newDraft.redSummonerlist[4].icon} alt=''/>
        </div>
      </div>
      )
    }
    else{
      return(<></>)
    }
  }

  ///possibly should be inside of the champlist but that requires redoing CSS (gross)

  return( 
    <div className="grid-container">
      <CountdownTimer/>
      <BlueSideDraft/>
      <RedSideDraft/>
      <ChampSelect/>
      <BlueSideBans/>
      <RedSideBans/>
      <div className='lock-button'>
        <input className='confirm-button' type='button' value={'LOCK'} onClick={()=>handleConfirm()}/>
      </div>
    </div>
  )
}