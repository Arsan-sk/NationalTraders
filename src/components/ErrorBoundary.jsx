import {Component} from 'react';
export default class ErrorBoundary extends Component{state={e:false};static getDerivedStateFromError(){return{e:true}}
 render(){return this.state.e?<section className="wrap sec"><h2>This page hit a problem</h2><p>Please reload to continue.</p><button className="btn red" onClick={()=>location.reload()}>Reload page</button></section>:this.props.children}}
