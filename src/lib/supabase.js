const API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"
export async function getSheet(sheetName) {
  const res = await fetch(`${API_URL}?sheet=${sheetName}`)
  const text = await res.text()
  try {
    return JSON.parse(text).values || []
  } catch(e) {
    console.error('getSheet error:', text)
    return []
  }
}

export async function appendRow(sheetName, values) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'append', sheet: sheetName, values })
  })
  const text = await res.text()
  console.log('appendRow response:', text)
  try {
    return JSON.parse(text)
  } catch(e) {
    console.error('appendRow error:', text)
    return null
  }
}

export async function updateRow(sheetName, row, values) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', sheet: sheetName, row, values })
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch(e) {
    console.error('updateRow error:', text)
    return null
  }
}

export async function uploadFile(ticketId, fileName, mimeType, fileData) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadFile',
      ticketId,
      fileName,
      mimeType,
      fileData
    })
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch(e) {
    console.error('uploadFile error:', text)
    return null
  }
}