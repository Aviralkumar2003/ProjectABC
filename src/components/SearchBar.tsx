import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import config from "../config/config";
import SearchBarProps from "../interfaces/SearchBarProps";

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert("Please enter a valid search term.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchValue
        )}.json?access_token=${config.mapboxAPI}`
      );

      const result = await response.json();

      if (!response.ok || !result.features || result.features.length === 0) {
        throw new Error("Location not found.");
      }

      console.log(result);

      const feature = result.features[0];
      const coordinates: [number, number] = feature.center;

      const bbox = feature.bbox;

      onSearch(coordinates, bbox);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch location data. Please try again.");
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={(e) => e.preventDefault()}
      sx={{ p: "2px 4px", display: "flex", alignItems: "center" }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search Maps"
        inputProps={{ "aria-label": "search maps" }}
        value={searchValue}
        onChange={handleInputChange}
      />
      <IconButton
        type="button"
        sx={{ p: "10px" }}
        aria-label="search"
        onClick={handleSearch}
      >
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}
