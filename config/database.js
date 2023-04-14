const dbconfig = {
    host: '127.0.0.1',
    port: 3050,
    database : 'C:\\Microsip datos\\BILLPACK.fdb',
    user: 'SYSDBA',
    password: 'chocolate21',
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
    retryConnectionInterval:1000,
};

dbconfig.charset= 'ISO8859_1';

export { dbconfig };