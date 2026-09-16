const {render}=require('./render2');
const T=require('./timelines');
const which=process.argv[2];
const map={ '1':['percurso',T.percurso], '2':['interacoes',T.interacoes], '3':['ritmo',T.ritmo] };
const [name,build]=map[which];
render({name, fps:30, build}).catch(e=>{console.error(name,e.message);process.exit(1);});
