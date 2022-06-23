import React, { forwardRef, memo, useState, useCallback, useMemo } from 'react';
import { View, Dimensions, ViewStyle, LayoutChangeEvent } from 'react-native';
import {
  chunkArray,
  calculateDimensions,
  generateStyles,
  getAdjustedTotalDimensions,
} from './utils';
import { FlatList } from 'react-native-gesture-handler';

const FlatGrid = memo(
  forwardRef<FlatList, FlatGridPropTypes>((props, ref) => {
    const {
      fixed = false,
      itemDimension = 120,
      spacing = 10,
      horizontal = false,
      invertedRow = false,
      adjustGridToStyles = false,
      style,
      data,
      renderItem,
      onLayout,
      staticDimension,
      maxDimension,
      additionalRowStyle: externalRowStyle,
      itemContainerStyle,
      keyExtractor,
      maxItemsPerRow,
      ...restProps
    } = props;

    const [totalDimension, setTotalDimension] = useState<number>(() => {
      let defaultTotalDimension = staticDimension;

      if (!staticDimension) {
        const dimension = horizontal ? 'height' : 'width';
        defaultTotalDimension = getAdjustedTotalDimensions({
          totalDimension: Dimensions.get('window')[dimension],
          maxDimension,
          contentContainerStyle: restProps.contentContainerStyle,
          style,
          horizontal,
          adjustGridToStyles,
        });
      }

      return defaultTotalDimension ?? 0;
    });

    const onLayoutLocal = useCallback(
      (e) => {
        if (!staticDimension) {
          const { width, height } = e.nativeEvent.layout || {};
          let newTotalDimension = horizontal ? height : width;

          newTotalDimension = getAdjustedTotalDimensions({
            totalDimension: newTotalDimension,
            maxDimension,
            contentContainerStyle: restProps.contentContainerStyle,
            style,
            horizontal,
            adjustGridToStyles,
          });

          if (totalDimension !== newTotalDimension && newTotalDimension > 0) {
            setTotalDimension(newTotalDimension);
          }
        }

        // call onLayout prop if passed
        if (onLayout) {
          onLayout(e);
        }
      },
      [
        staticDimension,
        onLayout,
        horizontal,
        maxDimension,
        restProps.contentContainerStyle,
        style,
        adjustGridToStyles,
        totalDimension,
      ]
    );

    const renderRow = useCallback(
      ({
        rowItems,
        rowIndex,
        separators,
        isLastRow,
        itemsPerRow,
        rowStyle,
        containerStyle,
      }: {
        rowItems: any;
        rowIndex: number;
        separators?: ViewStyle;
        isLastRow: boolean;
        itemsPerRow: number;
        rowStyle: ViewStyle;
        containerStyle: ViewStyle;
      }) => {
        // To make up for the top padding
        let additionalRowStyle = {};
        if (isLastRow) {
          additionalRowStyle = {
            ...(!horizontal ? { marginBottom: spacing } : {}),
            ...(horizontal ? { marginRight: spacing } : {}),
          };
        }

        return (
          <View style={[rowStyle, additionalRowStyle, externalRowStyle]}>
            {rowItems.map((item: any, index: number) => {
              const i = invertedRow ? -index + itemsPerRow - 1 : index;

              return (
                <View
                  key={
                    keyExtractor
                      ? keyExtractor(item, i)
                      : `item_${rowIndex * itemsPerRow + i}`
                  }
                  style={[containerStyle, itemContainerStyle]}
                >
                  {renderItem({
                    item,
                    index: rowIndex * itemsPerRow + i,
                    separators,
                    rowIndex,
                  })}
                </View>
              );
            })}
          </View>
        );
      },
      [
        renderItem,
        spacing,
        keyExtractor,
        externalRowStyle,
        itemContainerStyle,
        horizontal,
        invertedRow,
      ]
    );

    const { containerDimension, itemsPerRow, fixedSpacing } = useMemo(
      () =>
        calculateDimensions({
          itemDimension,
          staticDimension,
          totalDimension,
          spacing,
          fixed,
          maxItemsPerRow,
        }),
      [
        itemDimension,
        staticDimension,
        totalDimension,
        spacing,
        fixed,
        maxItemsPerRow,
      ]
    );

    const { containerStyle, rowStyle } = useMemo(
      () =>
        generateStyles({
          horizontal,
          itemDimension,
          containerDimension,
          spacing,
          fixedSpacing,
          fixed,
        }),
      [
        horizontal,
        itemDimension,
        containerDimension,
        spacing,
        fixedSpacing,
        fixed,
      ]
    );

    let rows = chunkArray(data, itemsPerRow); // Splitting the data into rows
    if (invertedRow) {
      rows = rows.map((r: any[]) => r.reverse());
    }

    const localKeyExtractor = useCallback(
      (rowItems, index) => {
        if (keyExtractor) {
          return rowItems
            .map((rowItem: any, rowItemIndex: number) =>
              keyExtractor(rowItem, rowItemIndex)
            )
            .join('_');
        }
        return `row_${index}`;
      },
      [keyExtractor]
    );

    return (
      <FlatList
        data={rows}
        ref={ref}
        extraData={totalDimension}
        renderItem={({ item, index }) =>
          renderRow({
            rowItems: item,
            rowIndex: index,
            isLastRow: index === rows.length - 1,
            itemsPerRow,
            rowStyle,
            containerStyle,
          })
        }
        style={[
          {
            ...(horizontal
              ? { paddingLeft: spacing }
              : { paddingTop: spacing }),
          },
          style,
        ]}
        onLayout={onLayoutLocal}
        keyExtractor={localKeyExtractor}
        {...restProps}
        horizontal={horizontal}
      />
    );
  })
);

interface FlatGridPropTypes {
  renderItem: ({
    item,
    index,
    separators,
    rowIndex,
  }: {
    item: any;
    index: number;
    separators?: ViewStyle;
    rowIndex: number;
  }) => void;
  data: Array<any>;
  itemDimension?: number;
  maxDimension?: number;
  fixed?: boolean;
  spacing?: number;
  style?: ViewStyle;
  additionalRowStyle?: ViewStyle;
  itemContainerStyle?: ViewStyle;
  staticDimension?: number;
  horizontal?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  keyExtractor?: (item: any, index: number) => string;
  listKey?: string;
  invertedRow?: boolean;
  maxItemsPerRow?: number;
  adjustGridToStyles?: boolean;
  contentContainerStyle?: ViewStyle;
}

export default FlatGrid;
