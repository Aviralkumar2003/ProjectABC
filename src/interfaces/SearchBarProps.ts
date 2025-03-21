interface SearchBarProps {
    onSearch: (centerCoordinates: [number, number],
        polygonCoordinates: [number, number, number, number]
    ) => void;
}

export default SearchBarProps;
  