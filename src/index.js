import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import OpenSeadragonAnnotator from './OpenSeadragonAnnotator';
import { 
  WebAnnotation, 
  createEnvironment,
  setLocale 
} from '@recogito/recogito-client-core';

import '@recogito/annotorious/src/ImageAnnotator.scss';
import '@recogito/recogito-client-core/themes/default';

class OSDAnnotorious {

  constructor(viewer, conf) {
    const config = conf || {};

    this._app = React.createRef();
    
    this._emitter = new Emitter();

    this._env = createEnvironment();

    const viewerEl = viewer.element;

    if (!viewerEl.style.position)
      viewerEl.style.position = 'relative';

    setLocale(config.locale);

    this.appContainerEl = document.createElement('DIV');

    viewerEl.appendChild(this.appContainerEl);
    
    ReactDOM.render(
      <OpenSeadragonAnnotator 
        ref={this._app}
        viewer={viewer} 
        wrapperEl={viewerEl}
        config={config} 
        env={this._env}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationCreated={this.handleAnnotationCreated} 
        onAnnotationUpdated={this.handleAnnotationUpdated} 
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onMouseEnterAnnotation={this.handleMouseEnterAnnotation}
        onMouseLeaveAnnotation={this.handleMouseLeaveAnnotation} 
        onSelectionCanceled={this.handleSelectionCanceled} />, this.appContainerEl);
  }

  /********************/               
  /*  External events */
  /********************/  

  handleSelectionCanceled = annotation =>
    this._emitter.emit('cancelSelection', annotation._stub);

  handleAnnotationCreated = (annotation, overrideId) =>
    this._emitter.emit('createAnnotation', annotation.underlying, overrideId);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleMouseEnterAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseEnterAnnotation', annotation.underlying, evt);

  handleMouseLeaveAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseLeaveAnnotation', annotation.underlying, evt);

  handleAnnotationSelected = annotation => 
    this._emitter.emit('selectAnnotation', annotation.underlying);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  /********************/               
  /*  External API    */
  /********************/  

  // Common shorthand for handling annotationOrId args
  _wrap = annotationOrId =>
    annotationOrId?.type === 'Annotation' ? new WebAnnotation(annotationOrId) : annotationOrId;

  addAnnotation = annotation =>
    this._app.current.addAnnotation(new WebAnnotation(annotation));

  clearAuthInfo = () =>
    this._env.user = null;
  
  destroy = () =>
    ReactDOM.unmountComponentAtNode(this.appContainerEl);

  fitBounds = (annotationOrId, immediately) =>
    this._app.current.fitBounds(this._wrap(annotationOrId), immediately);

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }
  
  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  off = (event, callback) =>
    this._emitter.off(event, callback);

  on = (event, handler) =>
    this._emitter.on(event, handler);

  panTo = (annotationOrId, immediately) =>
    this._app.current.panTo(this._wrap(annotationOrId), immediately);

  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  selectAnnotation = annotationOrId => {
    const selected = this._app.current.selectAnnotation(this._wrap(annotationOrId));
    return selected?.underlying;
  }
  
  setAnnotations = annotations => {
    const safe = annotations || []; // Allow null for clearning all current annotations
    const webannotations = safe.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

  setAuthInfo = authinfo =>
    this._env.user = authinfo;

  setDrawingEnabled = enable =>
    this._app.current.setDrawingEnabled(enable);

  setDrawingTool = shape =>
    this._app.current.setDrawingTool(shape);

  setServerTime = timestamp => 
    this._env.setServerTime(timestamp);

}

export default (viewer, config) =>
  new OSDAnnotorious(viewer, config); 
