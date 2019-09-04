import React, { Component } from 'react';
import { FaGithubAlt, FaPlus, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import api from '../../services/api';

import Container from '../../components/Container';
import { Form, SubmitButton, List } from './styles';

export default class Main extends Component {
  state = {
    newRepo: '',
    repositories: [],
    loading: false,
    error: '',
  };

  // Carregar os dados do localstorage
  componentDidMount() {
    const repositories = localStorage.getItem('repositories');

    if (repositories) {
      this.setState({ repositories: JSON.parse(repositories) });
    }
  }

  // Salvar os dados do localStorage
  componentDidUpdate(_, prevState) {
    const { repositories } = this.state;
    if (prevState.repositories !== repositories) {
      localStorage.setItem('repositories', JSON.stringify(repositories));
    }
  }

  handleInputChange = e => {
    this.setState({ newRepo: e.target.value, error: false });
  };

  handleSubmit = async e => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const { newRepo, repositories } = this.state;

      const hasRepo = repositories.find(r => r.name === newRepo);

      if (newRepo === '') throw new Error('missing text');

      const reg = /([a-z])+\/([a-z])+/i;
      if (!newRepo.match(reg)) throw new Error('regex fail');

      if (hasRepo) throw new Error('found local data');

      const response = await api.get(`/repos/${newRepo}`);
      const data = {
        name: response.data.full_name,
      };

      this.setState({
        repositories: [...repositories, data],
        newRepo: '',
      });
    } catch (err) {
      let error = '';
      switch (err.toString()) {
        case 'Error: missing text':
          error = 'Você precisa indicar um repositório';
          break;
        case 'Error: regex fail':
          error = 'Um repositório tem o formato <dev>/<projeto>';
          break;
        case 'Error: found local data':
          error = 'Repositório já registrado';
          break;
        case 'Error: Request failed with status code 404':
          error = 'Repositório não encontrado';
          break;
        default:
          error = err.toString();
      }

      if (typeof error === typeof '') {
        this.setState({ error });
      } else {
        this.setState({ error: error.toString() });
        // this.setState({ error: 'Parece que esse repositório não existe' });
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { newRepo, repositories, loading, error } = this.state;
    return (
      <Container>
        <h1>
          <FaGithubAlt />
          Repositórios
        </h1>

        <Form onSubmit={this.handleSubmit} error={error}>
          <input
            type="text"
            placeholder="Adicionar Repositório"
            value={newRepo}
            onChange={this.handleInputChange}
          />
          {error && <span>{error}</span>}

          <SubmitButton loading={loading ? 1 : 0}>
            {loading ? (
              <FaSpinner color="#fff" size={14} />
            ) : (
              <FaPlus color="#fff" size={14} />
            )}
          </SubmitButton>
        </Form>
        <List>
          {repositories.map(repository => (
            <li key={repository.name}>
              <span>{repository.name}</span>
              <Link to={`/repository/${encodeURIComponent(repository.name)}`}>
                Detalhes
              </Link>
            </li>
          ))}
        </List>
      </Container>
    );
  }
}
