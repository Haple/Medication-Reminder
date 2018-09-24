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

function deleteUser(del_user) {
  
  fetch('users', {
    method: 'delete',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'del_user': del_user
    })
  })
  .then(res => {
    window.location.reload()
  })
}