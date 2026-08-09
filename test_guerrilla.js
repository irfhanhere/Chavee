async function run() {
  try {
    const res = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address');
    const json = await res.json();
    console.log('Guerrilla Mail response:', json);
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
