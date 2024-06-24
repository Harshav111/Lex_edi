import { styled, Box, TextField } from "@mui/material";

export const FloatingDivContainer = styled(Box)({
  position: "absolute",
  zIndex: 100,
  top: -10000,
  left: -10000,
  marginTop: -6,
  maxWidth: 300,
  width: "100%",
  opacity: 0,
  backgroundColor: "#fff",
  boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.3)",
  borderRadius: 8,
  transition: "opacity 0.5s",
  padding: "8px", // Added padding for inner content spacing
  boxSizing: "border-box", // Ensure padding and border are included in width
  "&:hover": {
    opacity: 1,
  },
});

export const FloatingDivLinkInput = styled(TextField)({
  display: "block",
  width: "100%",
  borderRadius: 15,
  margin: "8px 0", // Adjusted margin
  fontSize: 15,
  color: "rgb(5, 5, 5)",
  backgroundColor: "#fff", // Added background color for consistency
  "& .MuiInputBase-root": {
    fontSize: 15,
    color: "rgb(5, 5, 5)",
    "&:hover, &:focus": {
      backgroundColor: "#f0f0f0", // Adjusted hover and focus styles
    },
  },
});

export const FloatingDivLink = styled("a")({
  display: "block",
  width: "calc(100% - 24px)",
  margin: "8px 0", // Adjusted margin
  padding: "8px 12px",
  borderRadius: 15,
  backgroundColor: "#eee",
  fontSize: 15,
  color: "rgb(5, 5, 5)",
  textDecoration: "none", // Removed underline for link
  "&:hover": {
    backgroundColor: "#ddd", // Adjusted hover background color
  },
});
