import React, { useCallback, useEffect, useRef } from 'react'
import { View, Dimensions, SafeAreaView } from 'react-native';
import { ListRenderItemInfo } from 'react-native';
import { Masonry } from 'react-native-waterfall-list'

const DEVICE_WIDTH = Dimensions.get('screen').width;
const GAP = 10;
interface IItem {
  id: number;
  height: number;
  color: string;
}

const Item = (props: Omit<IItem, 'id'>) => {
  const { height, color } = props;
  return (
    <View
      style={{
        height, 
        backgroundColor: color,
        width: ((DEVICE_WIDTH - (GAP * 3)) / 2) ,
      }}
    />
  )
}

const items: IItem[] = [
  { id: 1,  height: 200, color: 'red' },
  { id: 2,  height: 300, color: 'blue' },
  { id: 3,  height: 100, color: 'green' },
  { id: 4,  height: 400, color: 'orange' },
  { id: 5,  height: 200, color: 'teal' },
  { id: 6,  height: 100, color: 'steelblue' },
  { id: 7,  height: 150, color: 'green' },
  { id: 8,  height: 100, color: 'orange' },
  { id: 9,  height: 250, color: 'teal' },
  { id: 10, height: 100, color: 'steelblue' },
  { id: 11, height: 200, color: 'gray' },
  { id: 12, height: 300, color: 'blue' },
  { id: 13, height: 100, color: 'green' },
  { id: 14, height: 400, color: 'orange' },
  { id: 15, height: 200, color: 'teal' },
  { id: 16, height: 100, color: 'steelblue' },
  { id: 17, height: 150, color: 'green' },
  { id: 18, height: 100, color: 'orange' },
  { id: 19, height: 250, color: 'teal' },
  { id: 20, height: 100, color: 'steelblue' },
  { id: 21, height: 200, color: 'gray' },
  { id: 30, height: 100, color: 'steelblue' },
  { id: 31, height: 200, color: 'gray' },
  { id: 32, height: 300, color: 'blue' },
  { id: 33, height: 100, color: 'green' },
  { id: 34, height: 400, color: 'orange' },
  { id: 35, height: 200, color: 'teal' },
  { id: 36, height: 100, color: 'steelblue' },
  { id: 37, height: 150, color: 'green' },
  { id: 38, height: 100, color: 'orange' },
  { id: 39, height: 250, color: 'teal' },
  { id: 40, height: 100, color: 'steelblue' },
  { id: 41, height: 200, color: 'gray' },
]

const App = () => {

  useEffect(() => {
    list.current?.addMoreData(items)
  }, []);
  const list = useRef<Masonry<IItem>>(null);
  
  const renderItem = useCallback((e: ListRenderItemInfo<IItem>) => {
    const { item, index } = e;
    return (
      <Item
        height={item.height}
        color={item.color}
      />
    )
  }, []);

  const keyExtractor = (item: IItem) => item.id.toString();

  return (
    <View style={{ width: '100%', flex: 1 }}>
      <SafeAreaView />
      <Masonry
        numColumns={2}
        ref={list}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        gap={GAP}
      />
    
    </View>
  )
}

export default App
