import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import useInterval from 'use-interval';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay} from 'react-native-reanimated'


let words = require("./words.json")

const colors = {
  black: '#121213',
  yellow: '#b59b3f',
  lightGray: '#818384',
  darkGray: '#3a3a3c',
  white: '#d7dadc',
  green: '#538d4e'
}

const letters=[
  ['E','R','T','Y','U','I','O','P','Ğ','Ü'],
  ['A','S','D','F','G','H','J','K','L','Ş','İ'],
  ['ENTER','Z','C','V','B','N','M','Ö','Ç','DEL']
]
function random() {
  let result = []
  for (let i = 0; i < 6; ++i) {
    result.push(words[Math.floor(Math.random()*5702)])
  }
  return result
}
const answer = random()
console.log(answer)

function Tile({color, letter, order}) {

  const oldColor = useRef('black')
  const sh = useSharedValue({deg: 0, color:colors.black})

  if(color !== oldColor.current){
    oldColor.current = color
    sh.value = withDelay(order*350, withSequence(withTiming({deg: 90, color:color === 'black' ? colors.darkGray : colors[color]}, {duration: 175}), withTiming({deg: 270, color:colors[color]}, {duration: 0}), withTiming({deg: 360, color:colors[color]}, {duration: 175}))) 
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {transform: [{rotateX: `${sh.value.deg}deg`}],
            backgroundColor: sh.value.color,
            borderColor: sh.value.color === colors.black ? colors.darkGray : sh.value.color}
  })

  return(
    <Animated.View style={[styles.box(color), animatedStyle]}>
      <Text style={styles.letter2} selectable={false}>{letter}</Text>
    </Animated.View>
  )
  
}

export default function App() {
  const [state, setState] = useState({data: ['','','','','',''],colors:[['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black']], row: 0})
  const [isPlaying, setIsPlaying] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const [time, setTime] = useState(180)
  const [grayLetters, setGrayLetters] = useState([])
  const [yellowLetters, setYellowLetters] = useState([])
  const [greenLetters, setGreenLetters] = useState([])

  useEffect(() => {
    function keyDownHandler(e) {
      e.preventDefault();
      const key = e.key === 'ı' ? 'I' : e.key === 'i' ? 'İ' : e.key.toUpperCase()
      
      if(key === 'ENTER'){
        onPressEnter()
      }
      else if(key === 'BACKSPACE'){
        onPressDel()
      }
      else if(letters[0].includes(key) || letters[1].includes(key) || letters[2].includes(key)){
        onPressLetter(key)
      }
    }

    Platform.OS === 'web' && document.addEventListener("keydown", keyDownHandler);

    return () => {
      Platform.OS === 'web' && document.removeEventListener("keydown", keyDownHandler);
    };
  }, [state]);


  function onPressLetter(letter) {
    if(!isPlaying)
      return;

    if(state.data[state.row].length < 5){
      const newState = {...state}
      newState.data[state.row] += letter
      setState(newState)
    }
  }

  useInterval(() => {
    if(time > -2){
      setTime(t => t-1)
    }
    else{
      Toast.hide()
    }
    if(time === 0){
      Toast.show({
        text1: `Kelime: ${answer[wordIndex]}`,
        onHide: () => {setIsPlaying(false)}
      })
    }
  },  isPlaying ? 1000 : null)

  function onPressEnter(){
    if(!isPlaying)
      return;

    if(!words.some(word => word === state.data[state.row])){
      Toast.show({
        text1: 'Kelime Yok',
        visibilityTime: 2000
      })
      return
    }

    if(state.data[state.row].length === 5 && state.row < 6){
      const newState = {...state}
      let yellow = [...yellowLetters]
      let green = [...greenLetters]
      let gray = [...grayLetters]

      for(let i = 0; i < 5; ++i){
        if(newState.data[newState.row].charAt(i) === answer[wordIndex].charAt(i)){
          newState.colors[newState.row][i] = 'green'
          green = [...green, answer[wordIndex].charAt(i)]
        }
      }

      let yellowed = [false, false, false, false, false]
      for(let i = 0; i < 5; ++i){
        if(newState.colors[newState.row][i] !== 'green'){
          
          for (let j = 0; j < 5; ++j) {
            if(newState.data[newState.row].charAt(i) === answer[wordIndex].charAt(j) && newState.colors[newState.row][j] !== 'green' && !yellowed[j]){
              yellowed[j] = true
              newState.colors[newState.row][i] = 'yellow'
              yellow = [...yellow, newState.data[newState.row].charAt(i)]
              break
            }
          }
          if(newState.colors[newState.row][i] !== 'yellow'){
            newState.colors[newState.row][i] = 'darkGray'
            gray = [...gray, newState.data[newState.row].charAt(i)]
          }
        }
      }

      setTimeout(() => {
        setYellowLetters(yellow)
        setGreenLetters(green)
        setGrayLetters(gray)
      }, 1750)

      if(newState.colors[newState.row].every(color => color === 'green')){
        Toast.show({
          text1: 'Tebrikler',
          visibilityTime: 2000,
          onHide: () => {setIsPlaying(false)}
        })
      }
      else
        newState.row += 1

      setState(newState)

      if(newState.row > 5){
        Toast.show({
          text1: `Kelime: ${answer[wordIndex]}`,
          visibilityTime: 2000,
          onHide: () => {setIsPlaying(false)}
        })
      }
    }
  }

  function onPressDel(){
    if(!isPlaying)
      return;
  
    if(state.data[state.row].length > 0){
      const newState = {...state}
      newState.data[state.row] = newState.data[state.row].slice(0,-1)
      setState(newState)
    }
  }

  function onPressNext(){
    if(wordIndex < answer.length-1){
      setIsPlaying(true)
      setWordIndex(i => i+1)
      setTime(180)
      setGrayLetters([])
      setGreenLetters([])
      setYellowLetters([])
      setState({data: ['','','','','',''],colors:[['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black'],['black','black','black','black','black']], row: 0})
    }
  }

  return (
    <View style={styles.container}>


      <Modal visible={!isPlaying} animationType='fade' transparent={true}>
        <View style={styles.modal}>
          <Pressable style={styles.next} onPress={onPressNext}>
            {wordIndex < answer.length-1
              ? <Text style={styles.letter}>Sıradaki</Text>
              : <Text style={styles.letter}>Bitti</Text>
            }
          </Pressable>
        </View>
      </Modal>

      <View style={styles.top}>
        <Text style={[styles.letter, {fontSize: 24}]}>WORDLE TÜRKÇE</Text>
        <Text style={[styles.letter, {fontSize: 24}]}>{time >= 0 ? `${parseInt(time/60)}:${String(time%60).padStart(2, '0')}` : '0:00'}</Text>
      </View>

      <View style={styles.board}>
        {[0,1,2,3,4,5].map(row => {
          return(
            <View style={styles.boardRow} key={row}>
              {[0,1,2,3,4].map(column => {
                return(
                  <Tile key={wordIndex*10 + column} letter={state.data[row].charAt(column)} color={state.colors[row][column]} order={column} />
                )
              })}
            </View>
          )
        })}
      </View>

      <View style={styles.keyboard}>
        <View style={styles.keyboardRow}>
          {letters[0].map(item => <Pressable style={[styles.letterBox, {backgroundColor: greenLetters.includes(item) ? colors.green : yellowLetters.includes(item) ? colors.yellow : grayLetters.includes(item) ? colors.darkGray : colors.lightGray}]} onPress={() => onPressLetter(item)} key={item} ><Text style={styles.letter} selectable={false}>{item}</Text></Pressable>)}
        </View>
        <View style={[styles.keyboardRow,{width: '95%'}]}>
          {letters[1].map(item => <Pressable style={[styles.letterBox, {width: '8%', backgroundColor: greenLetters.includes(item) ? colors.green : yellowLetters.includes(item) ? colors.yellow : grayLetters.includes(item) ? colors.darkGray : colors.lightGray}]} onPress={() => onPressLetter(item)} key={item} ><Text style={styles.letter} selectable={false}>{item}</Text></Pressable>)}
        </View>
        <View style={styles.keyboardRow}>
          {letters[2].map(item => {
            if(item === 'ENTER')
              return <Pressable style={[styles.letterBox, {width: '11%'}]} onPress={onPressEnter} key={item} ><Text style={styles.letter} selectable={false}>{item}</Text></Pressable>
            if(item === 'DEL')
              return <Pressable style={[styles.letterBox, {width: '11%'}]} onPress={onPressDel} key={item} ><Text style={styles.letter} selectable={false}>{item}</Text></Pressable>
            
            return <Pressable style={[styles.letterBox, {backgroundColor: greenLetters.includes(item) ? colors.green : yellowLetters.includes(item) ? colors.yellow : grayLetters.includes(item) ? colors.darkGray : colors.lightGray}]} onPress={() => onPressLetter(item)} key={item} ><Text style={styles.letter} selectable={false}>{item}</Text></Pressable>
          })
            
          }
        </View>
      </View>

      <Toast/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modal:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  next:{
    width: '75%',
    height: '75%',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },

  top:{
    flex: 2,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },

  board: {
    flex: 6,
    justifyContent: 'space-between',
    width: '60%'
  },

  boardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '16%',
  },

  box: (color) => ({
    width: '19%',
    height: '100%',
    borderColor: color === 'black' ? colors.darkGray : colors[color],
    backgroundColor: colors[color],
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  }),

  keyboard:{
    marginTop: 12,
    flex: 3,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%'
  },

  keyboardRow: {
    flexDirection: 'row',
    height: '33%',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center'
  },

  letterBox:{
    height: '90%',
    width: '9%',
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center'
  },

  letter: {
    color: colors.white,
    fontWeight : '600',
    fontSize: 12
  },

  letter2: {
    color: colors.white,
    fontWeight : 'bold',
    fontSize: 30
  },

});
