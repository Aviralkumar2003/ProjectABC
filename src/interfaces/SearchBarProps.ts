interface SearchBarProps {
    onSearch: (coordinates: [number, number],
        bbox: [number, number, number, number]
    ) => void;
}

export default SearchBarProps;
  