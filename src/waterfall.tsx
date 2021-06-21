// @ts-nocheck
import * as _ from 'lodash'
import * as React from 'react'
import { PropsWithChildren } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  ViewabilityConfig,
  VirtualizedList,
} from 'react-native'
import * as Animatable from 'react-native-animatable'
import Animated from 'react-native-reanimated'

const DEVICE_WIDTH = Dimensions.get('screen').width

interface IWaterfallProps<T> extends Partial<FlatListProps<T>> {
  gap?: number
  enableFadeIn?: boolean
  loading?: boolean
}

interface FooterComponentProps {
  loading: boolean
}
interface ItemHeight {
  height: number
}

type ComponentOrElement =
  | React.ComponentType<any>
  | React.ReactElement
  | JSX.Element
  | null
type DistanceFromEnd = { distanceFromEnd: number }
type Condition<T> = (item: T) => item is T
type Mutation<T> = (item: T) => T
type ItemWithHeight<T> = T & ItemHeight

const { createAnimatableComponent } = Animatable
const AnimatableView = createAnimatableComponent(View)

const ListFooterComponent = (
  props: PropsWithChildren<FooterComponentProps>
) => {
  const { children, loading = false } = props
  return (
    <View>
      {children}
      <ActivityIndicator animating={loading} />
    </View>
  )
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

class Waterfall<T> extends React.Component<IWaterfallProps<T>, any> {
  static defaultProps = {
    numColumns: 2,
    onEndReachedThreshold: 0.1,
    gap: 5,
    enableFadeIn: false,
    keyExtractor: (item: any, index: number) => {
      if (item.key != null) {
        return item.key
      }
      if (item.id != null) {
        return item.id
      }

      return String(index)
    },
  }

  hasReachedEnd: boolean

  list: any

  viewabilityConfig: ViewabilityConfig

  constructor(props: IWaterfallProps<T>) {
    super(props)
    const { numColumns } = this.props
    const data = [...Array(numColumns)].map((_) => [])
    this.hasReachedEnd = false
    this.viewabilityConfig = {
      itemVisiblePercentThreshold: 100,
    }
    this.state = {
      data,
    }
  }

  checkHasData = () => {
    const { data = [] } = this.state
    let hasData = false
    data.forEach((columns) => {
      columns.forEach((item) => {
        if (item) {
          hasData = true
        }
      })
    })
    return hasData
  }

  clearData = () => {
    this.setState((prevState: any) => ({
      data: prevState.data.map((columns) => []),
    }))
  }

  addMoreData = (items: any[] = []) => {
    const startTime = new Date().getTime()
    const { numColumns } = this.props
    const _data = [...Array(numColumns)].map((_) => [])

    const dataDimensions = this.state.data.map((columns) =>
      columns.map((item) => ({ height: item.height || 0 }))
    )

    items.forEach((item, index) => {
      const readyColumnIndex = this.getReadyColumnIndex(dataDimensions)

      _data[readyColumnIndex].push(item)
      dataDimensions[readyColumnIndex].push({ height: item.height || 0 }) // 对当前分配的位置的下一次计算，进行补加
    })

    this.preDataDimensions = this.state.data.map((columns) =>
      columns.map((item) => ({ height: item.height || 0 }))
    )

    this.setState(
      {
        data: this.state.data.map((lastColumnData, columnIndex) =>
          _.unionBy(lastColumnData, _data[columnIndex], this.comparator)
        ),
      },
      () => {
        const overTime = new Date().getTime()
      }
    )
  }

  comparator = (item: T) => {
    const { keyExtractor } = this.props
    return keyExtractor?.(item, 0)
  }

  getReadyColumnIndex = (dimensions = []) => {
    const columnsTotalHeights = dimensions.map((columnDimensions) =>
      columnDimensions.map((_) => _.height).reduce((x, y) => x + y, 0)
    )
    const minHeights = Math.min(...columnsTotalHeights)
    const minIndex = columnsTotalHeights.indexOf(minHeights)
    return minIndex
  }

  componentDidMount = async () => {}

  _captureRef = (ref) => {
    this._listRef = ref
  }

  _keyExtractor = (items, index) => {
    const { keyExtractor } = this.props
    return keyExtractor(items, index)
  }

  _getItem = (data, index, columnIndex) => data[index]

  _getItemCount = (data: any) => data.length || 0

  _renderItem = ({ item, index, columnIndex }) => {
    const { renderItem, gap } = this.props

    if (this.props.enableFadeIn) {
      const { preDataDimensions = [] } = this
      const preColumns = preDataDimensions[columnIndex] || []
      let _index = index
      if (index > preColumns.length - 1) {
        _index = index - (preColumns.length - 1)
      }

      return (
        <AnimatableView
          // animation={"fadeInUp"}
          animation={{
            from: {
              opacity: 0.7,
              translateY: 50,
            },
            to: {
              opacity: 1,
              translateY: 0,
            },
          }}
          delay={200 * _index}
          style={{
            marginBottom: gap,
          }}
        >
          {renderItem({ item, index })}
        </AnimatableView>
      )
    }

    return (
      <View
        style={{
          marginBottom: gap,
        }}
      >
        {renderItem({ item, index })}
      </View>
    )
  }

  isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    if (
      layoutMeasurement.height > contentSize.height ||
      contentOffset.y <= 20
    ) {
      return false
    }
    const { onEndReachedThreshold = 0.1 } = this.props
    const visibleLength = layoutMeasurement.height
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height * onEndReachedThreshold
    )
  }

  isLeaveToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const { onEndReachedThreshold = 0.1 } = this.props
    const visibleLength = layoutMeasurement.height
    return (
      layoutMeasurement.height + contentOffset.y <
      contentSize.height - onEndReachedThreshold * visibleLength
    )
  }

  onEndReached = (e: DistanceFromEnd) => {
    const { onEndReached } = this.props
    onEndReached && onEndReached(e)
  }

  onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { onScroll } = this.props
    onScroll?.(e)

    if (this.isLeaveToBottom(e.nativeEvent)) {
      this.hasReachedEnd = false
    }

    if (this.hasReachedEnd) {
      return
    }

    if (this.isCloseToBottom(e.nativeEvent)) {
      this.onEndReached(e)
    }
  }

  getItemLayout = (data: ItemWithHeight<T>[], index: number) => {
    const length = data[index].height
    const offset = data
      .slice(0, index)
      .reduce((acc: number, item: ItemWithHeight<T>) => acc + item.height, 0)
    return { length, offset, index }
  }

  renderItem = (e: ListRenderItemInfo<any>) => {
    const { item: columnsData, index: columnIndex } = e
    const {
      gap = 0,
      numColumns,
      contentContainerStyle,
      removeClippedSubviews,
    } = this.props
    const isLastColumn = columnIndex + 1 === numColumns
    return (
      <VirtualizedList
        style={[
          {},
          {
            marginLeft: gap,
            marginRight: isLastColumn ? gap : 0,
          },
        ]}
        // contentContainerStyle={styles.contentContainerStyle}
        key={columnIndex}
        keyExtractor={this._keyExtractor}
        getItem={(item, index) => this._getItem(item, index, columnIndex)}
        getItemCount={this._getItemCount}
        data={columnsData}
        renderItem={({ item, index }) =>
          this._renderItem({ item, index, columnIndex })
        }
        viewabilityConfig={this.viewabilityConfig}
        nestedScrollEnabled
        pointerEvents='box-none'
        maxToRenderPerBatch={4}
        windowSize={4}
        listKey={`virtual-column-item-index-${columnIndex}`}
      />
    )
  }

  columnKeyExtractor = (item: any, index: number) =>
    `waterfall-column-index-${index}`

  getItemWithColumns = () => {
    const data = [...this.state.data]
    const itemsWithColumns = (data as Array<T[]>).map(
      (column: T[], columnIndex: number) =>
        column.map((item, itemIndex) => ({
          ...item,
          column: columnIndex,
          index: itemIndex,
        }))
    )

    const items = [].concat.apply([], itemsWithColumns as never[]) as Array<
      T & { column: number; index: number }
    >
    return items
  }

  mutateItemInColumn = (condition: Condition<T>, mutation: Mutation<T>) => {
    const data = [...this.state.data]
    const items = this.getItemWithColumns()
    const found = items.find(condition)

    if (found) {
      const { column, index } = found
      data[column][index] = mutation(data[column][index])
      this.setState({ data })
    }
  }

  removeItemFromColumn = (condition: Condition<T>) => {
    const data = [...this.state.data]
    const items = this.getItemWithColumns()
    const found = items.find(condition)
    if (found) {
      const { column, index } = found
      data[column] = [
        ...data[column].slice(0, index),
        ...data[column].slice(index + 1, data[column].lenght),
      ]
      this.setState({ data })
    }
  }

  scrollToTop = () => {
    this.list?._component.scrollToOffset({ animated: true, offset: 0 })
  }

  handleRef = (e: any) => {
    this.list = e
  }

  columnsHasData = () => {
    const { data } = this.state
    const columnWithData = data.filter((column: any[]) => column.length)
    return !!columnWithData.length
  }

  render() {
    const {
      ListHeaderComponent,
      ListFooterComponent: footerElement,
      style = {},
      loading = false,
      numColumns = 2,
      contentContainerStyle,
      ListEmptyComponent,
      columnWrapperStyle = {},
    } = this.props
    const { data } = this.state
    const hasData = this.columnsHasData()
    return (
      <AnimatedFlatList
        {...this.props}
        ref={this.handleRef}
        renderItem={this.renderItem}
        numColumns={numColumns}
        data={hasData || loading ? data : []}
        keyExtractor={this.columnKeyExtractor}
        columnWrapperStyle={[
          { flex: 1, width: DEVICE_WIDTH / numColumns },
          columnWrapperStyle,
        ]}
        contentContainerStyle={[contentContainerStyle]}
        style={[{ flex: 1, width: DEVICE_WIDTH }, style]}
        onEndReached={this.onEndReached}
        scrollEventThrottle={16}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={() => (
          <ListFooterComponent loading={loading}>
            {footerElement}
          </ListFooterComponent>
        )}
      />
    )
  }
}

export default Waterfall
