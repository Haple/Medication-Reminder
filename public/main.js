function deleteMedication(del_medication) {
  
  fetch('medications', {
    method: 'delete',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'del_medication': del_medication
    })
  })
  .then(res => {
    window.location.reload()
  })
}