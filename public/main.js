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
        if (res.ok) return res.json()
      })
      .then(data => {
        console.log(data)
        window.location.reload()
      })
}