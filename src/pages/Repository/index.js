import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import queryString from 'query-string';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, IssueList, Pagination, Filters } from './styles';

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
    filters: [{ state: 'all' }, { state: 'open' }, { state: 'closed' }],
    filterIndex: 0,
    page: 1,
    pageLimit: false,
  };

  async componentDidMount() {
    const { match, location } = this.props;
    const query = queryString.parse(location.search);
    if (['all', 'open', 'closed'].indexOf(query.state) < 0) {
      query.state = 'all';
    }

    const { filters } = this.state;
    const filterIndex = filters.findIndex(f => f.state === query.state);
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters[filterIndex].state,
          page: query.page || 1,
          per_page: perPage,
        },
      }),
    ]);

    await this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      working: false,
      filterIndex,
      page: query.page || 1,
      pageLimit: issues.data.length < perPage,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { page, filters, filterIndex } = this.state;
    const repoName = decodeURIComponent(match.params.repository);
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[filterIndex].state,
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

  handleFilter = async index => {
    await this.setState({
      filterIndex: index,
      page: 1,
      pageLimit: false,
    });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      working,
      filters,
      filterIndex,
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
          <Filters>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter.state}
                onClick={() => this.handleFilter(index)}
                disabled={index === filterIndex}
              >
                {filter.state}
              </button>
            ))}
          </Filters>
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
