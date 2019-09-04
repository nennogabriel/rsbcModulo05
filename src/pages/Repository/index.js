import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import queryString from 'query-string';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, IssueList, Pagination } from './styles';

const perPage = 5;
export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    working: true,
    page: 1,
    pageLimit: false,
  };

  async componentDidMount() {
    const { match, location } = this.props;
    const query = queryString.parse(location.search);
    // if (!(query.state in ['all', 'open', 'closed'])) {
    //   query.state = 'all';
    // }

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'all',
          page: query.page || 1,
          per_page: perPage,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      working: false,
      page: query.page || 1,
      pageLimit: issues.data.length < perPage,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { page } = this.state;
    const repoName = decodeURIComponent(match.params.repository);
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: 'all',
        page: page || 1,
        per_page: perPage,
      },
    });
    this.setState({
      issues: issues.data,
      working: false,
      pageLimit: issues.data.length < perPage,
    });
  };

  handlePage = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'next' ? Number(page) + 1 : Number(page) - 1,
      working: true,
    });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      working,
      page,
      pageLimit,
    } = this.state;
    if (loading) {
      return <Loading>Carregando...</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/"> Voltar aos repositórios </Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url} target="__blank">
                    {issue.title}
                  </a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <button
            type="button"
            onClick={() => this.handlePage('previous')}
            disabled={working || page < 2}
          >
            anterior
          </button>
          <span>{page}</span>
          <button
            type="button"
            onClick={() => this.handlePage('next')}
            disabled={working || pageLimit}
          >
            próximo
          </button>
        </Pagination>
      </Container>
    );
  }
}
