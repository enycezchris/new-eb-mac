import React, { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  randomCreatedDate,
  randomTraderName,
  randomUpdatedDate,
} from "@mui/x-data-grid-generator";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function App() {
  const misc = [
    {
      id: 1,
      name: randomTraderName(),
      age: 25,
      dateCreated: randomCreatedDate(),
      lastLogin: randomUpdatedDate(),
    },
  ];
  // for (let i = 1; i <= 5; i++) {
  //   misc.push({
  //     id: i,
  //     name: randomTraderName(),
  //     age: 25,
  //     dateCreated: randomCreatedDate(),
  //     lastLogin: randomUpdatedDate(),
  //   });
  // }
  const [data, setData] = useState(misc);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div style={{ height: "100%", width: "100%" }}>
        <DataGrid
          rows={data}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          pageSizeOptions={[20, 50, 100]}
        />
      </div>
    </ThemeProvider>
  );
}

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Name",
    width: 180,
    editable: true,
    cellClassName: "super-app-theme--cell",
  },
  {
    field: "age",
    headerName: "Age",
    type: "number",
    editable: true,
    align: "left",
    headerAlign: "left",
  },
  {
    field: "dateCreated",
    headerName: "Date Created",
    type: "date",
    width: 180,
    editable: true,
  },
  {
    field: "lastLogin",
    headerName: "Last Login",
    type: "dateTime",
    width: 220,
    editable: true,
  },
];
