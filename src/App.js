import { useState } from 'react';
import './App.css';
import toast from 'react-hot-toast';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Papa from "papaparse";
import * as XLSX from 'xlsx';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';

function App() {
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileError, setExcelFileError] = useState(null);
   // Function to handle the selection of an Excel file
   const handleFileChange = (e) => {
    let selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if the selected file is of the correct Excel format (XLSX) or CSV
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || "text/csv") {
        setExcelFileError(null);
        setExcelFile(selectedFile); // Store the selected file in state
      } else {
        setExcelFileError("Please select an Excel file (XLSX) or CSV file (CSV)");
        setExcelFile(null);
      }
    } else {
      alert("Please select a file");
    }
  };

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    if (excelFile !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        if (excelFile.name.endsWith('.csv')) {
          Papa.parse(fileData, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
            complete: async (result) => {
              const jsonData = result.data;
              await handleDownloadFiles(jsonData)
            }
          });
        }else if (excelFile.name.endsWith('.xlsx')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const fileData = event.target.result;
            const workbook = XLSX.read(fileData, { type: 'binary' });
            const sheetName = workbook.SheetNames[0]; // Assuming you want to read the first sheet
            const sheet = workbook.Sheets[sheetName];
        
            // Filter out empty rows
            const range = XLSX.utils.decode_range(sheet['!ref']);
            const csvData = XLSX.utils.sheet_to_csv(sheet, {
              range: range,
              blankrows: false, // Exclude blank rows
              raw: false, // Do not keep the raw value
            });
            Papa.parse(csvData, {
              header: true,
              dynamicTyping: false,
              skipEmptyLines: true,
              complete: async (result) => {
                const excelData = result.data.slice(0,result.data.length);
                await handleDownloadFiles(excelData)
              }
            });
          };
          reader.readAsBinaryString(excelFile); // Read the file as binary
        }
        else {
          setExcelFileError('Unsupported file format');
        }
      };
      reader.readAsBinaryString(excelFile); // Read the file as binary
    } else {
      setLoading(false)
      setExcelFileError("Please select excel file (XLSX)");
    }
  };

  const handleDownloadFiles = async (jsonData) => {
    try {
      const filteredData = jsonData.map((item) => item['External URL']);
      console.log(filteredData);
  
      // Function to download a single file
      const downloadFile = (url) => {
        return new Promise((resolve, reject) => {
          try {
            const link = document.createElement('a');
            link.href = url;
            link.download = ''; // Ensure the download prompt is shown
            link.style.display = 'none'; // Hide the link
  
            document.body.appendChild(link);
  
            // Create a click event and dispatch it
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
            });
  
            // Attach an event listener to ensure the link is processed
            link.addEventListener('click', () => {
              setTimeout(() => {
                resolve(); // Resolve the promise after some delay
              }, 40000); // 10 seconds delay to accommodate larger files
            });
  
            // Dispatch the click event
            link.dispatchEvent(clickEvent);
  
            // Remove the link from the document after a delay to allow the download to initiate
            setTimeout(() => {
              document.body.removeChild(link);
              console.log("Processed download:", url);
            }, 12000); // 12 seconds delay to ensure the download has started
            
            console.log("Initiated download:", url);
          } catch (error) {
            console.error("Error downloading:", url, error);
            reject(error);
          }
        });
      };
  
      // Download each file one after another
      for (const url of filteredData) {
        await downloadFile(url);
        // Introduce a longer delay between each download to ensure stability
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay between downloads
      }
  
      setLoading(false);
      document.querySelector('.upload-input').value = ''; // Reset the file input value
      setExcelFile(null);
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error('Internal Server Error');
    }
  };
  
  
  return (
    <div className="App">
        <form style={{ fontSize: "20px" }} autoComplete="off" onSubmit={handleSubmit} >
          <p className='content'>Please select a file*</p>
          <input type="file" className="upload-input" accept=".xlsx, .csv" onChange = {handleFileChange} />
          {excelFileError && (
            <div className="text-danger error-msg">
              {excelFileError}
            </div>
          )}
          {loading && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
            <CircularProgress size={20} />
          </Box>
            }
          <div>
            <div className="d-flex justify-content-center mb-4">
              <button type="submit" className="primary-button">
                UPLOAD
              </button>
            </div>
          </div>
        </form>
    </div>
  );
}

export default App;
