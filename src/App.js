import React, { Component } from 'react';
import Markdown from 'markdown-to-jsx';
import AceEditor from 'react-ace';
import styled from 'styled-components';
import brace from 'brace';
import 'brace/mode/markdown';
import 'brace/theme/dracula';
import './App.css';

const { ipcRenderer } = window.require('electron');
const settings = window.require('electron-settings');
const fs = window.require('fs');

class App extends Component {
  state = {
    loadedFile: '',
    dir: settings.get('dir') || null,
    filesData: []
  };

  constructor() {
    super();

    //On Load
    const dir = settings.get('dir');
    if (dir) {
      this.loadAndReadFiles(dir);
    }

    ipcRenderer.on('new-file', (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
    });

    ipcRenderer.on('new-dir', (event, dir) => {
      this.setState({
        dir: dir
      });
      settings.set('dir', dir);
      this.loadAndReadFiles(dir);
    });
  }

  loadAndReadFiles = dir => {
    fs.readdir(dir, (err, files) => {
      const filteredFiles = files.filter(file => file.includes('.md'));
      const filesData = filteredFiles.map(file => ({ path: `${dir}/${file}` }));

      this.setState({
        filesData
      });
    });
  };

  render() {
    return (
      <div className="App">
        <Header>Bullet Journal</Header>
        {this.state.dir ? (
          <Split>
            <div>
              {this.state.filesData.map(file => (
                <h1>{file.path}</h1>
              ))}
            </div>
            <CodeWindow>
              <AceEditor
                mode="markdown"
                theme="dracula"
                onChange={newContent => {
                  this.setState({ loadedFile: newContent });
                }}
                name="markdown_editor"
                value={this.state.loadedFile}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{this.state.loadedFile}</Markdown>
            </RenderedWindow>
          </Split>
        ) : (
          <OpenDirectoryMessage>
            <h1>Open directory</h1>
          </OpenDirectoryMessage>
        )}
      </div>
    );
  }
}

export default App;

const OpenDirectoryMessage = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
`;

const Header = styled.header`
  background-color: #191324;
  color: #75717c;
  font-size: 0.8rem;
  height: 23px;
  text-align: center;
  position: fixed;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  -webkit-app-region: drag;
`;

const Split = styled.div`
  display: flex;
  height: 100vh;
`;

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: #191324;
`;

const RenderedWindow = styled.div`
  background-color: #191324;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #302b3a;
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #82d8d8;
  }
  h1 {
    border-bottom: solid 3px #e54b4b;
    padding-bottom: 10px;
  }
  a {
    color: #e54b4b;
  }
`;
