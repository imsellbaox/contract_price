const {DDB} = require("dolphindb");
const fs = require("fs");
exports.dDBuild = class dDBuild {

    constructor(addr,user,password,db_name,table_name) { 
        this.addr = addr
        this.user = user
        this.password = password
        this.db_name = db_name
        this.table_name =table_name
        this.session = this.InitDB();
     }


    async InitDB() {
        let session = new DDB(this.addr, {
        autologin: true,
        username: this.user,
        password: this.password,
        python: false,
        streaming: undefined
        })
        await session.connect()
        return session
    }


    async InsertData(Timestamp,Symbol,inputAmount,quoteAmount) {
        const result = await (await this.session).eval(
        'def add_data() {\n'+
        'd = database("'+this.db_name+'")\n'+
        't = d.loadTable("'+this.table_name+'")\n'+
        'data = table(timestamp('+Timestamp+') as "timestamp", "'+Symbol+'" as "symbol",'+inputAmount+' as "baseAmount",'+quoteAmount+' as "quoteAmount")\n'+
        't.tableInsert(data)\n'+
        'return true\n'+
        '}\n'+
        'add_data()\n')
        
        fs.writeFile('./log.txt', `${new Date().getTime()}————存入成功！`, {flag: 'a',}, (err) => {
            if (err) {
              console.error(err)
            }
          })
    }
}